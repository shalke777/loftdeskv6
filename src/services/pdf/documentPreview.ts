import type { Estimate } from '@/entities/estimate/model'
import type { Invoice } from '@/entities/invoice/model'
import type { Contract } from '@/entities/contract/model'
import type { HandoverProtocol } from '@/entities/documentation/model'
import { formatCurrency } from '@/shared/lib/formatters'

type Party = {
  name?: string
  address?: string
  postalCity?: string
  nip?: string
  email?: string
  phone?: string
}

type CompanyMeta = Party & {
  bankAccount?: string
}

function replaceEvery(value: string, search: string, replacement: string) {
  return value.split(search).join(replacement)
}

function escapeHtml(value: string) {
  return replaceEvery(replaceEvery(replaceEvery(replaceEvery(replaceEvery(value, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), "'", '&#39;')
}

function escapeXml(value: string) {
  return replaceEvery(replaceEvery(replaceEvery(replaceEvery(replaceEvery(value, '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), "'", '&apos;')
}

function defaultCompany(company?: CompanyMeta): CompanyMeta {
  return {
    name: company?.name || 'LoftDesk',
    address: company?.address || 'Dane firmy do uzupełnienia w ustawieniach',
    postalCity: company?.postalCity || '',
    nip: company?.nip || '',
    email: company?.email || 'biuro@loftdesk.pl',
    phone: company?.phone || '+48 000 000 000',
    bankAccount: company?.bankAccount || 'PL00 0000 0000 0000 0000 0000 0000',
  }
}

function footer(company?: CompanyMeta) {
  const meta = defaultCompany(company)
  return `<div class="footer"><span>${escapeHtml(meta.name || 'LoftDesk')}</span><span>${escapeHtml(meta.email || '')}</span><span>${escapeHtml(meta.phone || '')}</span></div>`
}

function partyCard(title: string, party?: Party, fallbackName?: string) {
  return `<section class="party-card">
    <div class="party-card__label">${escapeHtml(title)}</div>
    <h3>${escapeHtml(party?.name || fallbackName || '—')}</h3>
    ${party?.address ? `<p>${escapeHtml(party.address)}</p>` : ''}
    ${party?.postalCity ? `<p>${escapeHtml(party.postalCity)}</p>` : ''}
    <p>${party?.nip ? `NIP ${escapeHtml(party.nip)}` : 'NIP —'}</p>
    ${party?.email ? `<p>${escapeHtml(party.email)}</p>` : ''}
    ${party?.phone ? `<p>${escapeHtml(party.phone)}</p>` : ''}
  </section>`
}

function metric(label: string, value: string) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
}

function pageShell(title: string, subtitle: string, content: string) {
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root {
    --paper: #f1f5f9;
    --surface: #ffffff;
    --surface-2: #f1f5f9;
    --ink: #0f172a;
    --muted: #64748b;
    --line: #e2e8f0;
    --line-strong: #cbd5e1;
    --brand: #dc2626;
    --brand-soft: #fef2f2;
    --success: #2f7a52;
    --shadow: 0 18px 50px rgba(32, 27, 23, .12);
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: linear-gradient(180deg, #e2e8f0, #f1f5f9 35%, #e2e8f0); color: var(--ink); font-family: Inter, Arial, sans-serif; }
  .doc { width: 920px; margin: 28px auto; background: var(--surface); border: 1px solid rgba(220,38,38,.10); border-radius: 28px; box-shadow: var(--shadow); overflow: hidden; }
  .page { min-height: 1260px; display: flex; flex-direction: column; }
  .head { display: flex; justify-content: space-between; gap: 20px; padding: 32px 40px 22px; background: linear-gradient(180deg, rgba(220,38,38,.06), rgba(220,38,38,0)); border-bottom: 1px solid var(--line); }
  .brand { display: grid; gap: 8px; }
  .brand__mark { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: var(--brand); color: #fff; font-weight: 800; letter-spacing: .04em; box-shadow: 0 4px 12px rgba(220,38,38,.14); }
  .brand__name { font-size: 14px; text-transform: uppercase; letter-spacing: .16em; color: var(--muted); }
  .brand__title { font-size: 34px; font-weight: 800; letter-spacing: -.03em; line-height: 1.04; }
  .brand__subtitle { color: var(--muted); max-width: 520px; line-height: 1.55; }
  .meta-card { min-width: 240px; align-self: flex-start; border: 1px solid var(--line); background: rgba(255,255,255,.78); border-radius: 22px; padding: 16px 18px; display: grid; gap: 10px; }
  .meta-card__label { font-size: 11px; text-transform: uppercase; letter-spacing: .18em; color: var(--muted); }
  .meta-card strong { font-size: 18px; }
  .content { padding: 24px 40px 38px; display: grid; gap: 22px; }
  .party-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  .party-card { border: 1px solid var(--line); border-radius: 24px; background: var(--surface-2); padding: 18px 20px; }
  .party-card__label { font-size: 11px; text-transform: uppercase; letter-spacing: .18em; color: var(--muted); margin-bottom: 10px; }
  .party-card h3 { margin: 0 0 8px; font-size: 20px; }
  .party-card p { margin: 4px 0; color: var(--muted); line-height: 1.5; }
  .metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .metric { border: 1px solid var(--line); border-radius: 20px; background: #fff; padding: 14px 16px; display: grid; gap: 6px; }
  .metric span { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
  .metric strong { font-size: 18px; }
  .table-wrap { border: 1px solid var(--line); border-radius: 24px; overflow: hidden; background: #fff; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 14px 16px; border-bottom: 1px solid var(--line); vertical-align: top; font-size: 14px; }
  th { background: #fbf7f2; color: var(--muted); text-transform: uppercase; letter-spacing: .12em; font-size: 11px; text-align: left; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.center, th.center { text-align: center; }
  tbody tr:last-child td { border-bottom: 0; }
  .desc { color: var(--muted); font-size: 12px; margin-top: 4px; line-height: 1.5; }
  .summary-panel { margin-left: auto; width: min(360px, 100%); border: 1px solid var(--line-strong); border-radius: 24px; background: linear-gradient(180deg, rgba(220,38,38,.04), rgba(220,38,38,.01)); padding: 18px 20px; }
  .summary-line { display: flex; justify-content: space-between; gap: 14px; padding: 8px 0; color: var(--muted); }
  .summary-line strong { color: var(--ink); }
  .summary-line--grand { margin-top: 6px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 18px; color: var(--brand); }
  .summary-line--grand strong { color: var(--brand); font-size: 22px; }
  .note-box, .section-box { border: 1px solid var(--line); border-radius: 24px; background: var(--surface-2); padding: 18px 20px; }
  .note-box h3, .section-box h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: .16em; color: var(--muted); }
  .note-box p, .section-box p, .section-box li { margin: 0; line-height: 1.7; color: var(--ink); }
  .section-box ul, .section-box ol { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
  .split { display: grid; grid-template-columns: 1.2fr .8fr; gap: 18px; }
  .signature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px; margin-top: 34px; }
  .signature { padding-top: 14px; border-top: 1px solid var(--line-strong); color: var(--muted); }
  .checklist { display: grid; gap: 10px; }
  .check { display: flex; justify-content: space-between; gap: 14px; border: 1px solid var(--line); border-radius: 18px; padding: 12px 14px; background: #fff; }
  .pill { display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 999px; background: var(--brand-soft); color: var(--brand); font-size: 12px; font-weight: 700; }
  .status-ok { color: var(--success); }
  .footer { margin-top: auto; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; padding: 18px 40px 28px; color: var(--muted); font-size: 13px; border-top: 1px solid var(--line); }
  @media print {
    body { background: #fff; }
    .doc { width: auto; margin: 0; box-shadow: none; border-radius: 0; }
    .page { min-height: auto; }
  }
</style>
</head>
<body>
  <div class="doc" aria-label="${escapeHtml(subtitle)}">${content}</div>
</body>
</html>`
}

function documentHead(title: string, subtitle: string, number: string, details: string[]) {
  return `<header class="head">
    <div class="brand">
      <div class="brand__mark">LD</div>
      <div class="brand__name">LoftDesk</div>
      <div class="brand__title">${escapeHtml(title)}</div>
      <div class="brand__subtitle">${escapeHtml(subtitle)}</div>
    </div>
    <aside class="meta-card">
      <span class="meta-card__label">Numer dokumentu</span>
      <strong>${escapeHtml(number)}</strong>
      ${details.map((detail) => `<div>${escapeHtml(detail)}</div>`).join('')}
    </aside>
  </header>`
}

function contractBody(contract: Contract, clientName?: string, projectName?: string) {
  const value = formatCurrency(contract.value)
  const notes = contract.notes || 'Strony ustalają, że szczegóły techniczne i harmonogram wynikają z wyceny oraz ustaleń roboczych.'
  const projectLine = projectName ? `dla realizacji: <strong>${escapeHtml(projectName)}</strong>.` : 'zgodnie z ustalonym zakresem prac.'

  if (contract.template_name === 'Umowa skrócona') {
    return `
      <div class="section-box">
        <h3>Najważniejsze ustalenia</h3>
        <p>Umowa została zawarta pomiędzy <strong>${escapeHtml(clientName || 'Klientem')}</strong> a <strong>Wykonawcą</strong>. Przedmiotem umowy jest wykonanie robót budowlanych / wykończeniowych ${projectLine}</p>
      </div>
      <div class="section-box">
        <h3>Rozliczenie</h3>
        <p>Łączna wartość umowy wynosi <strong>${escapeHtml(value)}</strong>. ${escapeHtml(notes)}</p>
      </div>`
  }

  if (contract.template_name === 'Umowa z etapami płatności') {
    return `
      <div class="section-box">
        <h3>Przedmiot umowy</h3>
        <ol>
          <li>Wykonawca zobowiązuje się do wykonania robót budowlanych / wykończeniowych dla <strong>${escapeHtml(clientName || 'Klienta')}</strong> ${projectLine}</li>
          <li>Zakres i standard wykonania wynikają z wyceny, ustaleń stron oraz zaakceptowanych zmian.</li>
        </ol>
      </div>
      <div class="section-box">
        <h3>Etapy i płatności</h3>
        <ol>
          <li>Wynagrodzenie za całość prac wynosi <strong>${escapeHtml(value)}</strong>.</li>
          <li>Rozliczenie następuje etapami zgodnie z harmonogramem płatności wskazanym poniżej.</li>
          <li>${escapeHtml(notes)}</li>
        </ol>
      </div>`
  }

  return `
    <div class="section-box">
      <h3>Przedmiot umowy</h3>
      <ol>
        <li>Wykonawca zobowiązuje się do wykonania robót budowlanych / wykończeniowych dla <strong>${escapeHtml(clientName || 'Klienta')}</strong> ${projectLine}</li>
        <li>Zakres prac, materiały i kolejność robót wynikają z zaakceptowanej wyceny oraz ustaleń stron.</li>
      </ol>
    </div>
    <div class="section-box">
      <h3>Wynagrodzenie i zasady wykonania</h3>
      <ol>
        <li>Łączna wartość umowy wynosi <strong>${escapeHtml(value)}</strong>.</li>
        <li>Prace będą prowadzone zgodnie ze sztuką budowlaną, uzgodnionym harmonogramem i standardem technicznym.</li>
        <li>${escapeHtml(notes)}</li>
      </ol>
    </div>`
}

export function buildEstimatePreview(estimate: Estimate, client?: Party, companyInput?: CompanyMeta) {
  const company = defaultCompany(companyInput)
  const rows = estimate.items.map((item) => {
    const net = item.quantity * item.unit_price
    const gross = net * (1 + item.vat_rate / 100)
    return `<tr>
      <td><strong>${escapeHtml(item.name)}</strong>${item.description ? `<div class="desc">${escapeHtml(item.description)}</div>` : ''}</td>
      <td class="center">${escapeHtml(item.unit)}</td>
      <td class="num">${item.quantity.toFixed(2)}</td>
      <td class="num">${formatCurrency(item.unit_price)}</td>
      <td class="num">${item.vat_rate}%</td>
      <td class="num">${formatCurrency(net)}</td>
      <td class="num">${formatCurrency(gross)}</td>
    </tr>`
  }).join('')
  const vatValue = estimate.total_gross - estimate.total_net
  const page = `<section class="page">
    ${documentHead('Wycena', 'Gotowy wzór dokumentu dla klienta — czytelny, lekki i przygotowany do PDF.', estimate.number, [
      `Data: ${(estimate.created_at || '').slice(0, 10) || '—'}`,
      `Ważna do: ${estimate.valid_until ? estimate.valid_until.slice(0, 10) : 'bez terminu'}`,
    ])}
    <div class="content">
      <div class="party-grid">
        ${partyCard('Wykonawca', company, company.name)}
        ${partyCard('Kontrahent', client, client?.name)}
      </div>
      <div class="metrics">
        ${metric('Status', estimate.status)}
        ${metric('Pozycji', String(estimate.items.length))}
        ${metric('Razem brutto', formatCurrency(estimate.total_gross))}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Pozycja</th><th class="center">J.m.</th><th class="num">Ilość</th><th class="num">Cena netto</th><th class="num">VAT</th><th class="num">Wartość netto</th><th class="num">Wartość brutto</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="summary-panel">
        <div class="summary-line"><span>Razem netto</span><strong>${formatCurrency(estimate.total_net)}</strong></div>
        <div class="summary-line"><span>Podatek VAT</span><strong>${formatCurrency(vatValue)}</strong></div>
        <div class="summary-line summary-line--grand"><span>Razem brutto</span><strong>${formatCurrency(estimate.total_gross)}</strong></div>
      </div>
      <div class="note-box">
        <h3>Uwagi</h3>
        <p>${escapeHtml(estimate.notes || 'Wycena obejmuje zakres prac wynikający z aktualnych ustaleń z klientem.')}</p>
      </div>
    </div>
    ${footer(company)}
  </section>`
  return pageShell(estimate.number, estimate.name, page)
}

export function buildInvoicePreview(invoice: Invoice, client?: Party, projectName?: string, companyInput?: CompanyMeta) {
  const company = defaultCompany(companyInput)
  const rows = invoice.items.map((item, index) => {
    const net = item.quantity * item.unit_price
    const vat = net * item.vat_rate / 100
    const gross = net + vat
    return `<tr>
      <td class="center">${index + 1}</td>
      <td><strong>${escapeHtml(item.description)}</strong>${item.tranche_label ? `<div class="desc">Rozliczenie: ${escapeHtml(item.tranche_label)}</div>` : ''}</td>
      <td class="center">${escapeHtml(item.unit)}</td>
      <td class="num">${item.quantity.toFixed(2)}</td>
      <td class="num">${formatCurrency(item.unit_price)}</td>
      <td class="num">${item.vat_rate}%</td>
      <td class="num">${formatCurrency(net)}</td>
      <td class="num">${formatCurrency(gross)}</td>
    </tr>`
  }).join('')
  const vatValue = invoice.total_gross - invoice.total_net
  const page = `<section class="page">
    ${documentHead('Faktura VAT', 'Wzór zgodny z prostym, czytelnym układem do wydruku i podglądu.', invoice.number, [
      `Data wystawienia: ${invoice.issue_date}`,
      `Termin płatności: ${invoice.due_date || '—'}`,
      `Status: ${invoice.status}`,
    ])}
    <div class="content">
      <div class="party-grid">
        ${partyCard('Sprzedawca', company, company.name)}
        ${partyCard('Nabywca', client, client?.name)}
      </div>
      <div class="metrics">
        ${metric('Projekt', projectName || 'bez projektu')}
        ${metric('KSeF', invoice.ksef_status || 'nie wysłano')}
        ${metric('Do zapłaty', formatCurrency(invoice.total_gross))}
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th class="center">Lp.</th><th>Pozycja</th><th class="center">J.m.</th><th class="num">Ilość</th><th class="num">Cena netto</th><th class="num">VAT</th><th class="num">Wartość netto</th><th class="num">Wartość brutto</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="split">
        <div class="note-box">
          <h3>Uwagi</h3>
          <p>${escapeHtml(invoice.notes || 'Dokument przygotowany do rozliczenia i eksportu XML.')}</p>
        </div>
        <div class="summary-panel" style="width:100%; margin-left:0;">
          <div class="summary-line"><span>Razem netto</span><strong>${formatCurrency(invoice.total_net)}</strong></div>
          <div class="summary-line"><span>VAT</span><strong>${formatCurrency(vatValue)}</strong></div>
          <div class="summary-line"><span>Rachunek</span><strong>${escapeHtml(company.bankAccount || '')}</strong></div>
          <div class="summary-line summary-line--grand"><span>Brutto</span><strong>${formatCurrency(invoice.total_gross)}</strong></div>
        </div>
      </div>
    </div>
    ${footer(company)}
  </section>`
  return pageShell(invoice.number, 'Faktura VAT', page)
}

export function buildInvoiceXml(invoice: Invoice) {
  const items = invoice.items
    .map((item) => `    <Item><Description>${escapeXml(item.description)}</Description><Quantity>${item.quantity}</Quantity><Unit>${escapeXml(item.unit)}</Unit><Net>${item.unit_price}</Net><Vat>${item.vat_rate}</Vat><Label>${escapeXml(item.tranche_label || '')}</Label></Item>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<Invoice>\n  <Number>${invoice.number}</Number>\n  <Status>${invoice.status}</Status>\n  <IssueDate>${invoice.issue_date}</IssueDate>\n  <DueDate>${invoice.due_date || ''}</DueDate>\n  <TotalNet>${invoice.total_net}</TotalNet>\n  <TotalGross>${invoice.total_gross}</TotalGross>\n  <ContractId>${invoice.contract_id || ''}</ContractId>\n  <EstimateId>${invoice.estimate_id || ''}</EstimateId>\n  <KsefStatus>${invoice.ksef_status || ''}</KsefStatus>\n  <Items>\n${items}\n  </Items>\n</Invoice>`
}

export function buildContractPreview(contract: Contract, clientName?: string, projectName?: string, companyInput?: CompanyMeta) {
  const company = defaultCompany(companyInput)
  const trancheRows = (contract.tranches ?? []).length
    ? (contract.tranches ?? []).map((item, index) => `<tr><td class="center">${index + 1}</td><td><strong>${escapeHtml(item.label)}</strong></td><td class="num">${formatCurrency(item.amount)}</td><td>${escapeHtml(item.due_date || 'Do ustalenia')}</td></tr>`).join('')
    : `<tr><td class="center">1</td><td><strong>Całość</strong></td><td class="num">${formatCurrency(contract.value)}</td><td>Do ustalenia</td></tr>`

  const page = `<section class="page">
    ${documentHead('Umowa', 'Gotowy wzór do podpisu — bez technicznego edytowania HTML, z danymi podstawionymi z aplikacji.', contract.number, [
      `Data podpisania: ${contract.sign_date || 'do ustalenia'}`,
      `Wzór: ${contract.template_name || 'Umowa standardowa'}`,
      `Kwota: ${formatCurrency(contract.value)}`,
    ])}
    <div class="content">
      <div class="party-grid">
        ${partyCard('Wykonawca', company, company.name)}
        ${partyCard('Inwestor / kontrahent', { name: clientName || 'Klient', address: projectName ? `Projekt: ${projectName}` : '' }, clientName || 'Klient')}
      </div>
      ${contractBody(contract, clientName, projectName)}
      <div class="table-wrap">
        <table>
          <thead><tr><th class="center">Etap</th><th>Płatność</th><th class="num">Kwota</th><th>Termin</th></tr></thead>
          <tbody>${trancheRows}</tbody>
        </table>
      </div>
      <div class="note-box">
        <h3>Postanowienia końcowe</h3>
        <p>Wszelkie zmiany zakresu, materiałów i terminów powinny być potwierdzone między stronami. Protokół odbioru, zaakceptowane zmiany i wycena stanowią uzupełnienie niniejszej umowy.</p>
      </div>
      <div class="signature-grid">
        <div class="signature">Podpis inwestora</div>
        <div class="signature">Podpis wykonawcy</div>
      </div>
    </div>
    ${footer(company)}
  </section>`
  return pageShell(contract.number, 'Umowa', page)
}

export function buildProtocolPreview(protocol: HandoverProtocol, clientName?: string, projectName?: string, companyInput?: CompanyMeta) {
  const company = defaultCompany(companyInput)
  const checklist = protocol.checklist.length
    ? protocol.checklist.map((item) => `<div class="check"><span>${escapeHtml(item.label)}</span><strong class="${item.accepted ? 'status-ok' : ''}">${item.accepted ? 'OK' : 'Do sprawdzenia'}</strong></div>`).join('')
    : '<div class="check"><span>Brak dodanej checklisty</span><strong>—</strong></div>'

  const page = `<section class="page">
    ${documentHead('Protokół odbioru', 'Dokument do potwierdzenia wykonania prac i spisania uwag.', protocol.title, [
      `Data odbioru: ${protocol.protocol_date || 'do ustalenia'}`,
      `Status: ${protocol.status}`,
      `Projekt: ${projectName || 'bez projektu'}`,
    ])}
    <div class="content">
      <div class="party-grid">
        ${partyCard('Wykonawca', company, company.name)}
        ${partyCard('Klient', { name: clientName || 'Klient', address: projectName ? `Projekt: ${projectName}` : '' }, clientName || 'Klient')}
      </div>
      <div class="note-box">
        <h3>Podsumowanie</h3>
        <p>${escapeHtml(protocol.summary || 'Odbiór częściowy / końcowy prac wykonanych zgodnie z zakresem robót i ustaleniami z klientem.')}</p>
      </div>
      <div class="section-box">
        <h3>Lista kontrolna</h3>
        <div class="checklist">${checklist}</div>
      </div>
      <div class="section-box">
        <h3>Uwagi</h3>
        <p>${escapeHtml(protocol.notes || 'Brak dodatkowych uwag przy odbiorze.')}</p>
      </div>
      <div class="signature-grid">
        <div class="signature">Podpis klienta</div>
        <div class="signature">Podpis wykonawcy</div>
      </div>
    </div>
    ${footer(company)}
  </section>`
  return pageShell(protocol.title, 'Protokół odbioru', page)
}
