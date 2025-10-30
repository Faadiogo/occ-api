const baseStyles = {
  wrapper: 'font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;background:#f8fafc',
  header: 'padding:20px 24px;color:#fff;border-radius:12px 12px 0 0;text-align:center',
  headerTitle: 'margin:0;font-size:20px;letter-spacing:.3px',
  body: 'border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px;background:#ffffff',
  item: 'margin:0 0 8px;font-size:14px;color:#0f172a',
  label: 'color:#475569',
  footer: 'margin-top:12px;color:#64748b;font-size:12px;text-align:center',
  badge: 'display:inline-block;padding:2px 8px;border-radius:999px;background:#e2e8f0;color:#0f172a;font-size:12px;margin-left:8px',
};

// URL pública do logo (hospedagem em Cloudinary, por exemplo)
const logoUrl = 'https://res.cloudinary.com/dymkqpb7i/image/upload/v1761853868/occ-bco_azwjcg.webp';

// Função para gerar o header com logo
const headerWithLogo = (title: string, badge?: string, bgColor: string = '#162653') => `
  <div style="${baseStyles.header};background:${bgColor}">
    <img src="${logoUrl}" alt="OCC" width="120" style="display:block;margin:0 auto 12px;">
    <h2 style="${baseStyles.headerTitle}">
      ${title} ${badge ? `<span style="${baseStyles.badge}">${badge}</span>` : ''}
    </h2>
  </div>
`;

// Função reutilizável para linhas de informação
function sectionRow(label: string, value?: string) {
  if (!value) return '';
  return `<p style="${baseStyles.item}"><span style="${baseStyles.label}"><strong>${label}:</strong></span> ${value}</p>`;
}

// Templates
export function contactTemplate(data: {
  name: string; email: string; phone?: string; company?: string; regime?: string; employees?: string; message?: string;
}) {
  return `
  <div style="${baseStyles.wrapper}">
    ${headerWithLogo('Novo contato recebido', 'Site OCC')}
    <div style="${baseStyles.body}">
      ${sectionRow('Nome', data.name)}
      ${sectionRow('E-mail', data.email)}
      ${sectionRow('Telefone', data.phone)}
      ${sectionRow('Empresa', data.company)}
      ${sectionRow('Regime', data.regime)}
      ${sectionRow('Colaboradores', data.employees)}
      ${data.message ? `<div style="margin-top:12px"><p style="${baseStyles.label}"><strong>Mensagem:</strong></p><div style="${baseStyles.item}">${String(data.message).replace(/\n/g,'<br>')}</div></div>` : ''}
    </div>
    <p style="${baseStyles.footer}">Enviado automaticamente pelo site OCC.</p>
  </div>`;
}

export function talentsTemplate(data: {
  name: string; email: string; phone?: string; sector?: string; experience?: string; message?: string;
}) {
  return `
  <div style="${baseStyles.wrapper}">
    ${headerWithLogo('Nova candidatura', 'Trabalhe Conosco')}
    <div style="${baseStyles.body}">
      ${sectionRow('Nome', data.name)}
      ${sectionRow('E-mail', data.email)}
      ${sectionRow('Telefone', data.phone)}
      ${sectionRow('Área', data.sector)}
      ${sectionRow('Cargo', data.experience)}
      ${data.message ? `<div style="margin-top:12px"><p style="${baseStyles.label}"><strong>Mensagem:</strong></p><div style="${baseStyles.item}">${String(data.message).replace(/\n/g,'<br>')}</div></div>` : ''}
    </div>
  </div>`;
}

export function newsletterTemplate(email: string) {
  return `
  <div style="${baseStyles.wrapper}">
    ${headerWithLogo('Nova inscrição na Newsletter')}
    <div style="${baseStyles.body}">
      ${sectionRow('E-mail', email)}
    </div>
  </div>`;
}

export function autoresponderContactTemplate(name?: string) {
  return `
  <div style="${baseStyles.wrapper}">
    ${headerWithLogo('Recebemos sua mensagem', undefined, '#162653')}
    <div style="${baseStyles.body}">
      <p style="${baseStyles.item}">Olá${name ? `, <strong>${name}</strong>` : ''}! Obrigado por entrar em contato com a OCC.</p>
      <p style="${baseStyles.item}">Recebemos sua mensagem e nossa equipe responderá em breve.</p>
      <p style="${baseStyles.item}">Se precisar, responda este e-mail para complementar as informações.</p>
      <p style="${baseStyles.item};margin-top:16px">Atenciosamente,<br><strong>Equipe OCC</strong></p>
    </div>
  </div>`;
}

export function autoresponderTalentsTemplate(name?: string) {
  return `
  <div style="${baseStyles.wrapper}">
    ${headerWithLogo('Candidatura recebida', undefined, '#162653')}
    <div style="${baseStyles.body}">
      <p style="${baseStyles.item}">Olá${name ? `, <strong>${name}</strong>` : ''}! Recebemos sua candidatura e agradecemos seu interesse.</p>
      <p style="${baseStyles.item}">Nosso time de RH analisará seu perfil e retornará o contato caso houver alinhamento.</p>
      <p style="${baseStyles.item};margin-top:16px">Atenciosamente,<br><strong>Equipe OCC</strong></p>
    </div>
  </div>`;
}

export function autoresponderNewsletterTemplate() {
  return `
  <div style="${baseStyles.wrapper}">
    ${headerWithLogo('Inscrição confirmada', undefined, '#162653')}
    <div style="${baseStyles.body}">
      <p style="${baseStyles.item}">Obrigado por assinar nossa newsletter! Você passará a receber conteúdos da OCC.</p>
      <p style="${baseStyles.item}">Caso não reconheça esta inscrição, ignore este e-mail.</p>
      <p style="${baseStyles.item};margin-top:16px">Atenciosamente,<br><strong>Equipe OCC</strong></p>
    </div>
  </div>`;
}
