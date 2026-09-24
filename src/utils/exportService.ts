import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { UserProfile, NutritionTargets, Meal, MacroTotals } from '../types';

interface ExportDataParams {
  user: UserProfile | null;
  targets: NutritionTargets | null;
  meals: Meal[];
  rangeLabel: string;
  waterIntakeMl?: number;
}

export class ExportService {
  /**
   * Export to formatted PDF document
   */
  static exportToPDF({ user, targets, meals, rangeLabel, waterIntakeMl }: ExportDataParams): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    // Header Background Accent
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, pageWidth, 6, 'F');

    // App & Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('NutriMacro - Relatório Nutricional', 14, y);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Período Selecionado: ${rangeLabel} | Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, y);

    y += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // User Profile Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Perfil do Usuário & Metas', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    const userName = user?.name || 'Usuário';
    const userEmail = user?.email || 'Não informado';
    const goalText = user?.goal || 'Manutenção';
    const currentWeight = user?.currentWeight ? `${user.currentWeight} kg` : '-';
    const targetWeight = user?.targetWeight ? `${user.targetWeight} kg` : '-';

    doc.text(`Nome: ${userName}`, 14, y);
    doc.text(`E-mail: ${userEmail}`, 110, y);
    y += 5;
    doc.text(`Objetivo: ${goalText.toUpperCase()}`, 14, y);
    doc.text(`Peso Atual: ${currentWeight} | Meta: ${targetWeight}`, 110, y);
    y += 5;

    if (targets) {
      doc.text(
        `Metas Diárias: ${targets.calories} kcal | P: ${targets.protein}g | C: ${targets.carbs}g | G: ${targets.fat}g | Água: ${targets.waterMl || 2500}ml`,
        14,
        y
      );
      y += 5;
    }

    if (typeof waterIntakeMl === 'number') {
      const waterGoal = targets?.waterMl || 2660;
      const pct = Math.round((waterIntakeMl / waterGoal) * 100);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199); // Sky/cyan
      doc.text(
        `Hidratação Registrada: ${waterIntakeMl} ml de ${waterGoal} ml (${pct}% da meta diária)`,
        14,
        y
      );
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
    }
    y += 8;
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    // Meals Detailed Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text(`2. Registro Detalhado de Refeições (${meals.length} refeições)`, 14, y);
    y += 7;

    if (meals.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('Nenhuma refeição registrada no período selecionado.', 14, y);
    } else {
      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      doc.text('Data/Hora', 16, y);
      doc.text('Refeição / Alimentos', 46, y);
      doc.text('Calorias', 125, y);
      doc.text('Proteínas', 145, y);
      doc.text('Carbos', 165, y);
      doc.text('Gorduras', 182, y);
      y += 6;

      // Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      meals.forEach((meal) => {
        // Page break if needed
        if (y > 270) {
          doc.addPage();
          y = 18;
        }

        const mealTotals = meal.items.reduce(
          (acc, item) => ({
            calories: acc.calories + (item.calories || 0),
            protein: acc.protein + (item.protein || 0),
            carbs: acc.carbs + (item.carbs || 0),
            fat: acc.fat + (item.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${meal.date} ${meal.time}`, 16, y);
        doc.text(`${meal.name || meal.type}`, 46, y);
        doc.text(`${Math.round(mealTotals.calories)} kcal`, 125, y);
        doc.text(`${Math.round(mealTotals.protein)}g`, 145, y);
        doc.text(`${Math.round(mealTotals.carbs)}g`, 165, y);
        doc.text(`${Math.round(mealTotals.fat)}g`, 182, y);
        y += 4.5;

        // Print individual items indented
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        meal.items.forEach((item) => {
          if (y > 275) {
            doc.addPage();
            y = 18;
          }
          doc.text(`• ${item.name} (${item.quantity}${item.unit})`, 50, y);
          doc.text(`${Math.round(item.calories)} kcal`, 125, y);
          doc.text(`${Math.round(item.protein)}g`, 145, y);
          doc.text(`${Math.round(item.carbs)}g`, 165, y);
          doc.text(`${Math.round(item.fat)}g`, 182, y);
          y += 4;
        });

        y += 2;
        doc.setDrawColor(241, 245, 249);
        doc.line(16, y, pageWidth - 16, y);
        y += 4;
      });
    }

    doc.save(`NutriMacro_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Export to XLSX Excel workbook
   */
  static exportToXLSX({ user, targets, meals }: ExportDataParams): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Detailed Items
    const itemsData: any[] = [];
    meals.forEach((meal) => {
      meal.items.forEach((item) => {
        itemsData.push({
          Data: meal.date,
          Horário: meal.time,
          'Tipo Refeição': meal.type,
          'Nome da Refeição': meal.name || meal.type,
          Alimento: item.name,
          Quantidade: item.quantity,
          Unidade: item.unit,
          'Calorias (kcal)': Math.round(item.calories),
          'Proteínas (g)': Math.round(item.protein * 10) / 10,
          'Carboidratos (g)': Math.round(item.carbs * 10) / 10,
          'Gorduras (g)': Math.round(item.fat * 10) / 10,
        });
      });
    });

    const wsItems = XLSX.utils.json_to_sheet(itemsData.length > 0 ? itemsData : [{ Aviso: 'Nenhum registro encontrado' }]);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Alimentos e Refeições');

    // Sheet 2: Daily Totals
    const dailyMap = new Map<string, MacroTotals>();
    meals.forEach((meal) => {
      const current = dailyMap.get(meal.date) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      meal.items.forEach((item) => {
        current.calories += item.calories;
        current.protein += item.protein;
        current.carbs += item.carbs;
        current.fat += item.fat;
      });
      dailyMap.set(meal.date, current);
    });

    const dailyData: any[] = [];
    dailyMap.forEach((totals, date) => {
      dailyData.push({
        Data: date,
        'Calorias Totais (kcal)': Math.round(totals.calories),
        'Meta Calorias': targets?.calories || 0,
        'Saldo Calórico': Math.round(totals.calories - (targets?.calories || 0)),
        'Proteínas (g)': Math.round(totals.protein),
        'Meta Proteína': targets?.protein || 0,
        'Carboidratos (g)': Math.round(totals.carbs),
        'Meta Carboidratos': targets?.carbs || 0,
        'Gorduras (g)': Math.round(totals.fat),
        'Meta Gorduras': targets?.fat || 0,
      });
    });

    const wsDaily = XLSX.utils.json_to_sheet(dailyData.length > 0 ? dailyData : [{ Aviso: 'Nenhum total diário' }]);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Totais Diários');

    // Sheet 3: Perfil e Metas
    const profileData = [
      { Parâmetro: 'Nome do Usuário', Valor: user?.name || 'Não informado' },
      { Parâmetro: 'E-mail', Valor: user?.email || 'Não informado' },
      { Parâmetro: 'Objetivo', Valor: user?.goal || 'Manutenção' },
      { Parâmetro: 'Peso Atual (kg)', Valor: user?.currentWeight || 0 },
      { Parâmetro: 'Meta de Peso (kg)', Valor: user?.targetWeight || 0 },
      { Parâmetro: 'Altura (cm)', Valor: user?.height || 0 },
      { Parâmetro: 'Meta Calórica Diária (kcal)', Valor: targets?.calories || 0 },
      { Parâmetro: 'Meta Proteica Diária (g)', Valor: targets?.protein || 0 },
      { Parâmetro: 'Meta de Carboidratos Diária (g)', Valor: targets?.carbs || 0 },
      { Parâmetro: 'Meta de Gorduras Diária (g)', Valor: targets?.fat || 0 },
      { Parâmetro: 'Meta de Água (ml)', Valor: targets?.waterMl || 2500 },
      { Parâmetro: 'Data de Exportação', Valor: new Date().toISOString() },
    ];
    const wsProfile = XLSX.utils.json_to_sheet(profileData);
    XLSX.utils.book_append_sheet(wb, wsProfile, 'Perfil & Metas');

    XLSX.writeFile(wb, `NutriMacro_Dados_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Export to DOC (Word compatible formatted document)
   */
  static exportToDOC({ user, targets, meals, rangeLabel }: ExportDataParams): void {
    let mealsRows = '';
    meals.forEach((meal) => {
      const mealTotals = meal.items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const itemsList = meal.items
        .map(
          (i) =>
            `<li style="margin-bottom: 3px;"><strong>${i.name}</strong> - ${i.quantity}${i.unit} (${Math.round(i.calories)} kcal | P: ${Math.round(i.protein)}g | C: ${Math.round(i.carbs)}g | G: ${Math.round(i.fat)}g)</li>`
        )
        .join('');

      mealsRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px; vertical-align: top;">${meal.date}<br/><small style="color: #64748b;">${meal.time}</small></td>
          <td style="padding: 8px; vertical-align: top;">
            <strong>${meal.name || meal.type}</strong>
            <ul style="margin: 4px 0 0 16px; padding: 0; font-size: 11px; color: #475569;">${itemsList}</ul>
          </td>
          <td style="padding: 8px; text-align: right; vertical-align: top; font-weight: bold;">${Math.round(mealTotals.calories)} kcal</td>
          <td style="padding: 8px; text-align: right; vertical-align: top;">${Math.round(mealTotals.protein)}g</td>
          <td style="padding: 8px; text-align: right; vertical-align: top;">${Math.round(mealTotals.carbs)}g</td>
          <td style="padding: 8px; text-align: right; vertical-align: top;">${Math.round(mealTotals.fat)}g</td>
        </tr>
      `;
    });

    const docContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>NutriMacro - Relatório Nutricional</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; padding: 20px; }
          h1 { color: #059669; font-size: 22pt; margin-bottom: 4px; border-bottom: 2px solid #059669; padding-bottom: 6px; }
          h2 { color: #0f172a; font-size: 14pt; margin-top: 20px; margin-bottom: 8px; }
          .meta-box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 8px; border-bottom: 2px solid #cbd5e1; }
          .footer { font-size: 9pt; color: #94a3b8; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>NutriMacro - Relatório Nutricional & Evolução</h1>
        <p><strong>Período:</strong> ${rangeLabel} | <strong>Emitido em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>

        <div class="meta-box">
          <h2>1. Dados do Usuário & Metas Nutricionais</h2>
          <p>
            <strong>Atleta/Usuário:</strong> ${user?.name || 'Não informado'} (${user?.email || 'Sem e-mail'})<br/>
            <strong>Objetivo:</strong> ${user?.goal?.toUpperCase() || 'MANUTENÇÃO'} | <strong>Peso Atual:</strong> ${user?.currentWeight || '-'} kg | <strong>Meta de Peso:</strong> ${user?.targetWeight || '-'} kg<br/>
            <strong>Metas Diárias:</strong> ${targets?.calories || 0} kcal | Proteínas: ${targets?.protein || 0}g | Carboidratos: ${targets?.carbs || 0}g | Gorduras: ${targets?.fat || 0}g | Água: ${targets?.waterMl || 2500}ml
          </p>
        </div>

        <h2>2. Registros de Refeições</h2>
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Refeição & Alimentos</th>
              <th style="text-align: right;">Calorias</th>
              <th style="text-align: right;">Proteínas</th>
              <th style="text-align: right;">Carbos</th>
              <th style="text-align: right;">Gorduras</th>
            </tr>
          </thead>
          <tbody>
            ${mealsRows || '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #94a3b8;">Nenhum registro encontrado para este período.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Relatório gerado pelo NutriMacro - Acompanhamento Nutricional com IA.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NutriMacro_Relatorio_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
