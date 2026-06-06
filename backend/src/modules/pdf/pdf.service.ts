import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Visit } from '../../database/entities/visit.entity';
import { User } from '../../database/entities/user.entity';
import { Prospect } from '../../database/entities/prospect.entity';
import { GpsEvent, GpsEvenement } from '../../database/entities/gps-event.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const PDF_DIR = path.join(process.cwd(), 'generated_pdfs');

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prospect)
    private readonly prospectRepository: Repository<Prospect>,
    @InjectRepository(GpsEvent)
    private readonly gpsEventRepository: Repository<GpsEvent>,
  ) {
    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
    }
  }

  private formatDuration(totalSeconds: number): string {
    if (totalSeconds <= 0) return '00:00:00';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async generateReport(
    delegateId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<string> {
    const delegate = await this.userRepository.findOne({
      where: { id: delegateId },
    });
    if (!delegate) {
      throw new NotFoundException('Délégué non trouvé');
    }

    const visits = await this.visitRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.prospect', 'prospect')
      .where('v.delegue_id = :delegateId', { delegateId })
      .andWhere('v.date_visite BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      })
      .orderBy('v.date_visite', 'ASC')
      .addOrderBy('v.heureArrivee', 'ASC')
      .getMany();

    const anomalies = await this.gpsEventRepository
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.prospect', 'prospect')
      .where('g.delegue_id = :delegateId', { delegateId })
      .andWhere('g.evenement = :anomalie', { anomalie: GpsEvenement.ANOMALIE })
      .andWhere('g.horodatage BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(`${dateFrom}T00:00:00Z`),
        dateTo: new Date(`${dateTo}T23:59:59Z`),
      })
      .orderBy('g.horodatage', 'DESC')
      .getMany();

    const inconsistencies = await this.gpsEventRepository
      .createQueryBuilder('g')
      .where('g.delegue_id = :delegateId', { delegateId })
      .andWhere('g.vitesse > 300')
      .andWhere('g.horodatage BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(`${dateFrom}T00:00:00Z`),
        dateTo: new Date(`${dateTo}T23:59:59Z`),
      })
      .getMany();

    const totalVisits = visits.length;
    const totalDuration = visits.reduce(
      (sum, v) => sum + (v.dureeSecondes || 0),
      0,
    );
    const shortVisits = visits.filter((v) => v.dureeSecondes !== null && v.dureeSecondes < 120);
    const longVisits = visits.filter((v) => v.dureeSecondes !== null && v.dureeSecondes > 10800);

    const visitsByProspect = new Map<string, { name: string; type: string; count: number }>();
    for (const v of visits) {
      const key = v.prospectId;
      if (!visitsByProspect.has(key)) {
        visitsByProspect.set(key, {
          name: v.prospect?.nom || 'Inconnu',
          type: v.prospect?.type || 'N/A',
          count: 0,
        });
      }
      visitsByProspect.get(key)!.count++;
    }

    const prospectsWithFewVisits = Array.from(visitsByProspect.entries())
      .filter(([, info]) => info.count < 2)
      .map(([, info]) => info.name);

    const filename = `rapport_${delegate.prenom}_${delegate.nom}_${dateFrom}_${dateTo}_${uuidv4().slice(0, 8)}.pdf`;
    const filePath = path.join(PDF_DIR, filename);

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Rapport - ${delegate.prenom} ${delegate.nom}`,
        Author: 'Mega Supervision',
        Subject: 'Rapport d\'activité',
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const primaryColor = '#1e40af';
    const secondaryColor = '#3b82f6';
    const accentColor = '#10b981';
    const warningColor = '#f59e0b';
    const dangerColor = '#ef4444';
    const grayColor = '#6b7280';
    const lightGray = '#f3f4f6';

    const drawHeader = () => {
      doc.rect(50, 50, 495, 60).fill(primaryColor);
      doc
        .fill('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('MEGA SUPERVISION', 70, 65);
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Rapport d\'activité terrain', 70, 90);
      doc
        .fontSize(9)
        .text(
          `Période: ${dateFrom} au ${dateTo}`,
          380,
          65,
          { align: 'right' },
        );
      doc
        .fontSize(9)
        .text(
          `Délégué: ${delegate.prenom} ${delegate.nom}`,
          380,
          80,
          { align: 'right' },
        );
    };

    const drawFooter = (page: number) => {
      const bottomY = doc.page.height - 50;
      doc
        .fontSize(8)
        .fillColor(grayColor)
        .text(
          `Mega Supervision - Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`,
          50,
          bottomY,
          { align: 'center' },
        );
      doc.text(`Page ${page}`, 495, bottomY, { align: 'right' });
    };

    const drawKpiCard = (
      x: number,
      y: number,
      title: string,
      value: string,
      color: string,
      width: number = 110,
    ) => {
      doc.roundedRect(x, y, width, 65, 8).fill(color);
      doc
        .fill('#ffffff')
        .fontSize(8)
        .font('Helvetica')
        .text(title, x + 10, y + 10, { width: width - 20, align: 'center' });
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(value, x + 10, y + 30, { width: width - 20, align: 'center' });
    };

    // ============ PAGE 1: SYNTHESE ============
    drawHeader();

    doc
      .fillColor('#111827')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Synthèse', 50, 125);

    doc
      .moveTo(50, 143)
      .lineTo(545, 143)
      .strokeColor(primaryColor)
      .stroke();

    const cardY = 160;
    drawKpiCard(50, cardY, 'Total visites', `${totalVisits}`, primaryColor);
    drawKpiCard(175, cardY, 'Temps terrain', this.formatDuration(totalDuration), secondaryColor);
    drawKpiCard(300, cardY, 'Temps prospect', this.formatDuration(totalDuration), accentColor);
    const unattributed = anomalies.length * 300;
    drawKpiCard(425, cardY, 'Tps non attribué', this.formatDuration(unattributed), warningColor);

    const avgDuration = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;

    const detailY = 260;
    doc
      .fillColor('#111827')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Détails de la période', 50, detailY);

    const details = [
      { label: 'Nombre total de visites', value: `${totalVisits}` },
      { label: 'Temps total sur le terrain', value: this.formatDuration(totalDuration) },
      { label: 'Durée moyenne par visite', value: this.formatDuration(avgDuration) },
      { label: 'Visites courtes (< 2min)', value: `${shortVisits.length}` },
      { label: 'Visites longues (> 3h)', value: `${longVisits.length}` },
      { label: 'Arrêts non associés', value: `${anomalies.length}` },
    ];

    let dy = detailY + 25;
    for (const d of details) {
      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(d.label, 70, dy);
      doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text(d.value, 420, dy, { align: 'right' });
      dy += 20;
    }

    drawFooter(1);

    // ============ PAGE 2: VISITES DETAIL ============
    doc.addPage();
    drawHeader();
    doc
      .fillColor('#111827')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Visites - Détail', 50, 125);
    doc
      .moveTo(50, 143)
      .lineTo(545, 143)
      .strokeColor(primaryColor)
      .stroke();

    const tableTop = 165;
    const colWidths = [160, 70, 80, 80, 70, 85];
    const colStarts = [50];
    for (let i = 1; i < colWidths.length; i++) {
      colStarts.push(colStarts[i - 1] + colWidths[i - 1]);
    }

    const headers = ['Prospect', 'Type', 'Arrivée', 'Départ', 'Durée', 'Nb visites'];

    doc.rect(50, tableTop, 495, 22).fill(primaryColor);
    for (let i = 0; i < headers.length; i++) {
      doc
        .fill('#ffffff')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(headers[i], colStarts[i] + 5, tableTop + 6, {
          width: colWidths[i] - 5,
        });
    }

    let rowY = tableTop + 24;
    let rowNum = 0;

    for (const [prospectId, info] of visitsByProspect) {
      if (rowY > 720) {
        drawFooter(2);
        doc.addPage();
        drawHeader();
        rowY = 140;
      }

      const bgColor = rowNum % 2 === 0 ? lightGray : '#ffffff';
      doc.rect(50, rowY, 495, 18).fill(bgColor);

      const visitsForProspect = visits
        .filter((v) => v.prospectId === prospectId)
        .sort(
          (a, b) =>
            new Date(a.dateVisite).getTime() - new Date(b.dateVisite).getTime(),
        );

      const firstVisit = visitsForProspect[0];
      const lastVisit = visitsForProspect[visitsForProspect.length - 1];

      doc
        .fillColor('#111827')
        .fontSize(8)
        .font('Helvetica')
        .text(info.name, colStarts[0] + 5, rowY + 5, { width: colWidths[0] - 5 });
      doc
        .text(info.type, colStarts[1] + 5, rowY + 5, { width: colWidths[1] - 5 });
      doc
        .text(firstVisit.heureArrivee.slice(0, 5), colStarts[2] + 5, rowY + 5, {
          width: colWidths[2] - 5,
        });
      doc
        .text(
          lastVisit.heureDepart ? lastVisit.heureDepart.slice(0, 5) : 'N/A',
          colStarts[3] + 5,
          rowY + 5,
          { width: colWidths[3] - 5 },
        );
      doc
        .text(
          firstVisit.dureeSecondes
            ? this.formatDuration(firstVisit.dureeSecondes)
            : 'N/A',
          colStarts[4] + 5,
          rowY + 5,
          { width: colWidths[4] - 5 },
        );
      doc
        .text(`${info.count}`, colStarts[5] + 5, rowY + 5, {
          width: colWidths[5] - 5,
        });

      rowY += 18;
      rowNum++;
    }

    drawFooter(2);

    // ============ PAGE 3: ANALYSE ============
    doc.addPage();
    drawHeader();
    doc
      .fillColor('#111827')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Analyse', 50, 125);
    doc
      .moveTo(50, 143)
      .lineTo(545, 143)
      .strokeColor(primaryColor)
      .stroke();

    let ay = 165;

    doc
      .fillColor('#111827')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Arrêts non associés (anomalies)', 50, ay);
    ay += 22;

    if (anomalies.length === 0) {
      doc
        .fillColor(accentColor)
        .fontSize(10)
        .font('Helvetica')
        .text('Aucune anomalie détectée.', 70, ay);
      ay += 20;
    } else {
      for (const a of anomalies.slice(0, 10)) {
        if (ay > 720) {
          drawFooter(3);
          doc.addPage();
          drawHeader();
          ay = 140;
        }
        doc
          .fillColor('#374151')
          .fontSize(8)
          .font('Helvetica')
          .text(
            `• ${a.horodatage.toLocaleDateString('fr-FR')} ${a.horodatage.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - Lat: ${a.latitude.toFixed(4)}, Lng: ${a.longitude.toFixed(4)}`,
            70,
            ay,
          );
        ay += 16;
      }
      if (anomalies.length > 10) {
        doc
          .fillColor(grayColor)
          .fontSize(8)
          .font('Helvetica')
          .text(`... et ${anomalies.length - 10} autres`, 70, ay);
        ay += 16;
      }
    }

    ay += 10;
    doc
      .fillColor('#111827')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Incohérences GPS', 50, ay);
    ay += 22;

    if (inconsistencies.length === 0) {
      doc
        .fillColor(accentColor)
        .fontSize(10)
        .font('Helvetica')
        .text('Aucune incohérence GPS détectée.', 70, ay);
      ay += 20;
    } else {
      for (const inc of inconsistencies.slice(0, 10)) {
        if (ay > 720) {
          drawFooter(3);
          doc.addPage();
          drawHeader();
          ay = 140;
        }
        doc
          .fillColor('#374151')
          .fontSize(8)
          .font('Helvetica')
          .text(
            `• ${inc.horodatage.toLocaleDateString('fr-FR')} - Vitesse: ${inc.vitesse} km/h`,
            70,
            ay,
          );
        ay += 16;
      }
    }

    ay += 10;
    doc
      .fillColor('#111827')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Visites courtes (< 2 minutes)', 50, ay);
    ay += 22;

    if (shortVisits.length === 0) {
      doc
        .fillColor(accentColor)
        .fontSize(10)
        .font('Helvetica')
        .text('Aucune visite courte détectée.', 70, ay);
      ay += 20;
    } else {
      for (const sv of shortVisits.slice(0, 10)) {
        if (ay > 720) {
          drawFooter(3);
          doc.addPage();
          drawHeader();
          ay = 140;
        }
        doc
          .fillColor('#374151')
          .fontSize(8)
          .font('Helvetica')
          .text(
            `• ${sv.prospect?.nom || 'Inconnu'} - ${new Date(sv.dateVisite).toLocaleDateString('fr-FR')} - ${sv.dureeSecondes}s`,
            70,
            ay,
          );
        ay += 16;
      }
    }

    ay += 10;
    doc
      .fillColor('#111827')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Visites longues (> 3 heures)', 50, ay);
    ay += 22;

    if (longVisits.length === 0) {
      doc
        .fillColor(accentColor)
        .fontSize(10)
        .font('Helvetica')
        .text('Aucune visite longue détectée.', 70, ay);
      ay += 20;
    } else {
      for (const lv of longVisits.slice(0, 10)) {
        if (ay > 720) {
          drawFooter(3);
          doc.addPage();
          drawHeader();
          ay = 140;
        }
        doc
          .fillColor('#374151')
          .fontSize(8)
          .font('Helvetica')
          .text(
            `• ${lv.prospect?.nom || 'Inconnu'} - ${new Date(lv.dateVisite).toLocaleDateString('fr-FR')} - ${this.formatDuration(lv.dureeSecondes!)}`,
            70,
            ay,
          );
        ay += 16;
      }
    }

    drawFooter(3);

    // ============ PAGE 4: RECOMMANDATIONS ============
    doc.addPage();
    drawHeader();
    doc
      .fillColor('#111827')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Recommandations', 50, 125);
    doc
      .moveTo(50, 143)
      .lineTo(545, 143)
      .strokeColor(primaryColor)
      .stroke();

    let ry = 165;

    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('1. Optimisation des tournées', 50, ry);
    ry += 22;

    const visitDates = [...new Set(visits.map((v) => v.dateVisite.toString()))].sort();
    if (visitDates.length > 0) {
      doc
        .fillColor('#374151')
        .fontSize(9)
        .font('Helvetica')
        .text(
          `Analyse basée sur ${totalVisits} visites réparties sur ${visitDates.length} jour(s).`,
          70, ry,
        );
      ry += 16;
      doc
        .text(
          'Il est recommandé de regrouper les visites par zone géographique pour minimiser les temps de déplacement entre les prospects.',
          70, ry,
        );
      ry += 30;
    } else {
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Aucune visite dans la période sélectionnée.', 70, ry);
      ry += 20;
    }

    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('2. Réduction du temps mort', 50, ry);
    ry += 22;

    if (anomalies.length > 0) {
      doc
        .fillColor('#374151')
        .fontSize(9)
        .font('Helvetica')
        .text(
          `${anomalies.length} arrêt(s) non associé(s) à un prospect ont été détectés, représentant environ ${this.formatDuration(anomalies.length * 300)} de temps non attribué.`,
          70, ry,
        );
      ry += 16;
      doc
        .text(
          'Ces arrêts pourraient correspondre à des pauses prolongées ou à des détours inutiles. Une optimisation des itinéraires permettrait de réduire ce temps mort.',
          70, ry,
        );
      ry += 30;
    } else {
      doc
        .fillColor(accentColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Aucun arrêt non associé détecté. La gestion du temps est optimale.', 70, ry);
      ry += 20;
    }

    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('3. Prospects insuffisamment visités', 50, ry);
    ry += 22;

    if (prospectsWithFewVisits.length > 0) {
      doc
        .fillColor('#374151')
        .fontSize(9)
        .font('Helvetica')
        .text(
          `${prospectsWithFewVisits.length} prospect(s) ont reçu moins de 2 visites sur la période :`,
          70, ry,
        );
      ry += 16;
      for (const name of prospectsWithFewVisits.slice(0, 15)) {
        if (ry > 720) {
          doc.addPage();
          drawHeader();
          ry = 140;
        }
        doc
          .fillColor('#374151')
          .fontSize(8)
          .font('Helvetica')
          .text(`• ${name}`, 85, ry);
        ry += 14;
      }
      ry += 10;
      doc
        .text(
          'Une fréquence de visite régulière est essentielle pour maintenir une relation commerciale de qualité.',
          70, ry,
        );
      ry += 30;
    } else {
      doc
        .fillColor(accentColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Tous les prospects ont reçu au moins 2 visites sur la période.', 70, ry);
      ry += 20;
    }

    doc
      .fillColor(primaryColor)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('4. Analyse de productivité', 50, ry);
    ry += 22;

    if (totalVisits > 0) {
      const benchmarkDuration = 900;
      const productivity =
        avgDuration > 0
          ? Math.min(100, Math.round((benchmarkDuration / avgDuration) * 100))
          : 0;
      doc
        .fillColor('#374151')
        .fontSize(9)
        .font('Helvetica')
        .text(
          `Durée moyenne de visite: ${this.formatDuration(avgDuration)}.`,
          70, ry,
        );
      ry += 16;
      doc
        .text(
          `Productivité estimée: ${productivity}% (référence: ${this.formatDuration(benchmarkDuration)} benchmark).`,
          70, ry,
        );
      ry += 16;

      if (productivity < 70) {
        doc
          .text(
            'La durée moyenne des visites est significativement plus élevée que le benchmark. Optimiser le contenu des visites pourrait améliorer le nombre de prospects visités par jour.',
            70, ry,
          );
      } else {
        doc
          .fillColor(accentColor)
          .text(
            'La durée moyenne des visites est conforme aux attentes. Maintenir cette cadence.',
            70, ry,
          );
      }
    }

    drawFooter(4);

    doc.end();

    return new Promise<string>((resolve, reject) => {
      stream.on('finish', () => resolve(filename));
      stream.on('error', reject);
    });
  }

  getPdfPath(filename: string): string {
    const filePath = path.join(PDF_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier PDF non trouvé');
    }
    return filePath;
  }

  listGeneratedPdfs(): { filename: string; createdAt: Date; size: number }[] {
    if (!fs.existsSync(PDF_DIR)) {
      return [];
    }
    return fs
      .readdirSync(PDF_DIR)
      .filter((f) => f.endsWith('.pdf'))
      .map((f) => {
        const stat = fs.statSync(path.join(PDF_DIR, f));
        return {
          filename: f,
          createdAt: stat.birthtime,
          size: stat.size,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
