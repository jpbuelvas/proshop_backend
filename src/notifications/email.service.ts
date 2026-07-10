import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Order } from '../orders/order.entity';

interface ProductNotificationOpts {
  toEmail: string;
  toName: string;
  product: { name: string; price: number; imageUrl?: string; description?: string };
  message?: string;
}

interface OrderMessageOpts {
  toEmail: string;
  toName: string;
  orderId: number;
  subject: string;
  message: string;
}

interface SupportMessageOpts {
  fromName: string;
  fromEmail: string;
  message: string;
  orderId?: number;
  order?: Order;
}

// ── Shared template builder ──────────────────────────────────────────────────
function buildEmail(title: string, preheader: string, bodyHtml: string): string {
  return '<!DOCTYPE html>'
    + '<html lang="es">'
    + '<head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>' + title + '</title>'
    + '<span style="display:none;max-height:0;overflow:hidden;">' + preheader + '</span>'
    + '</head>'
    + '<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;padding:28px 0;">'
    + '<tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">'
    + '<tr>'
    + '<td style="background:#111111;border-top:4px solid #c8102e;padding:28px 36px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td><span style="font-family:Arial,Helvetica,sans-serif;font-weight:900;font-size:22px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;">PRO SHOP</span></td>'
    + '<td align="right"><span style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:1px;text-transform:uppercase;">proshopbaq.com.co</span></td>'
    + '</tr></table>'
    + '</td>'
    + '</tr>'
    + '<tr><td style="background:#ffffff;padding:36px 36px 28px;">' + bodyHtml + '</td></tr>'
    + '<tr>'
    + '<td style="background:#1a1a1a;padding:20px 36px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td style="font-size:12px;color:rgba(255,255,255,0.4);line-height:1.7;">'
    + '<strong style="color:rgba(255,255,255,0.6);">Soporte:</strong> '
    + '<a href="mailto:soporte@proshopbaq.com.co" style="color:#c8102e;text-decoration:none;">soporte@proshopbaq.com.co</a>'
    + ' &nbsp;|&nbsp; Lun - Vie 8am - 6pm<br>'
    + '&copy; 2026 Pro Shop &mdash; Barranquilla, Colombia'
    + '</td>'
    + '</tr></table>'
    + '</td>'
    + '</tr>'
    + '</table>'
    + '</td></tr>'
    + '</table>'
    + '</body></html>';
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  SHIPPED: 'Enviado',
  DECLINED: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#22c55e',
  SHIPPED: '#3b82f6',
  DECLINED: '#ef4444',
};

function buildOrderSummaryHtml(order: Order): string {
  const status = order.status ?? 'PENDING';
  const statusLabel = STATUS_LABEL[status] ?? status;
  const statusColor = STATUS_COLOR[status] ?? '#999';
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  const itemRows = (order.items ?? []).map((item) => {
    const name = item.product?.name ?? 'Producto #' + item.productId;
    const variant = [item.size, item.color].filter((v) => v && v !== 'U').join(' / ');
    const variantHtml = variant ? ' <span style="color:#999;font-size:12px;">(' + variant + ')</span>' : '';
    return '<tr>'
      + '<td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#333;">' + name + variantHtml + '</td>'
      + '<td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;color:#555;">' + item.quantity + '</td>'
      + '<td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:700;color:#111;">$' + Number(item.unitPrice).toLocaleString('es-CO') + '</td>'
      + '</tr>';
  }).join('');

  const trackingBlock = (order.trackingNumber || order.dropiOrderId)
    ? '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111;margin-top:12px;">'
      + '<tr>'
      + (order.trackingNumber
        ? '<td style="padding:12px 16px;"><span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45);">Guia de envio</span><br><span style="font-size:16px;font-weight:900;color:#fff;letter-spacing:1px;">' + order.trackingNumber + '</span></td>'
        : '')
      + (order.dropiOrderId
        ? '<td style="padding:12px 16px;" align="right"><span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45);">ID Dropi</span><br><span style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);">' + order.dropiOrderId + '</span></td>'
        : '')
      + '</tr>'
      + '</table>'
    : '';

  return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e5e5;margin-bottom:20px;">'
    + '<tr><td style="background:#f5f5f5;padding:12px 16px;border-bottom:1px solid #e5e5e5;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    + '<td><span style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#555;">Pedido #' + order.id + '</span>'
    + (createdAt ? ' <span style="font-size:12px;color:#999;">&mdash; ' + createdAt + '</span>' : '')
    + '</td>'
    + '<td align="right"><span style="display:inline-block;padding:4px 12px;background:' + statusColor + ';color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">' + statusLabel + '</span></td>'
    + '</tr></table>'
    + '</td></tr>'
    + '<tr><td>'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0">'
    + '<thead><tr style="background:#111;">'
    + '<th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#fff;font-weight:700;">Producto</th>'
    + '<th style="padding:8px 12px;text-align:center;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#fff;font-weight:700;">Cant.</th>'
    + '<th style="padding:8px 12px;text-align:right;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#fff;font-weight:700;">Precio</th>'
    + '</tr></thead>'
    + '<tbody>' + itemRows + '</tbody>'
    + '<tfoot><tr style="background:#f9f9f9;">'
    + '<td colspan="2" style="padding:11px 12px;font-size:12px;font-weight:700;color:#555;border-top:2px solid #111;">TOTAL</td>'
    + '<td style="padding:11px 12px;text-align:right;font-size:16px;font-weight:900;color:#111;border-top:2px solid #111;">$' + Number(order.total).toLocaleString('es-CO') + '</td>'
    + '</tr></tfoot>'
    + '</table>'
    + '</td></tr>'
    + '<tr><td style="padding:12px 16px;border-top:1px solid #eee;">'
    + '<span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Enviar a</span><br>'
    + '<span style="font-size:13px;color:#333;">' + (order.shippingAddress ?? '') + (order.shippingCity ? ', ' + order.shippingCity : '') + '</span>'
    + (order.shippingPhone ? '<br><span style="font-size:12px;color:#666;">Tel: ' + order.shippingPhone + '</span>' : '')
    + trackingBlock
    + '</td></tr>'
    + '</table>';
}

function buildClientProfileHtml(order: Order): string {
  const user = order.user;
  if (!user) return '';
  return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e5e5;margin-bottom:20px;">'
    + '<tr><td style="background:#111;padding:10px 16px;"><span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.6);">Perfil del cliente</span></td></tr>'
    + '<tr><td style="padding:0;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" border="0">'
    + '<tr><td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;width:120px;">Nombre</td>'
    + '<td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111;font-weight:700;">' + (user.name ?? '-') + '</td></tr>'
    + '<tr><td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Email</td>'
    + '<td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;"><a href="mailto:' + (user.email ?? '') + '" style="color:#c8102e;text-decoration:none;font-weight:700;">' + (user.email ?? '-') + '</a></td></tr>'
    + (user.phone ? '<tr><td style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Telefono</td>'
    + '<td style="padding:10px 16px;font-size:13px;color:#333;">' + user.phone + '</td></tr>' : '')
    + '</table>'
    + '</td></tr>'
    + '</table>';
}

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const port = this.config.get<number>('EMAIL_PORT', 465);
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('EMAIL_HOST', 'smtp.hostinger.com'),
      port,
      secure: port === 465,
      auth: {
        user: this.config.get<string>('EMAIL_USER'),
        pass: this.config.get<string>('EMAIL_PASS'),
      },
    });
  }

  private get from(): string {
    return this.config.get<string>('EMAIL_FROM', 'Pro Shop <contacto@proshopbaq.com.co>');
  }

  async sendOrderConfirmation(order: Order): Promise<void> {
    const to = order.user?.email;
    if (!to) { this.logger.warn('Orden #' + order.id + ' sin email'); return; }

    const itemRows = (order.items ?? []).map((item) => {
      const name = item.product?.name ?? 'Producto';
      const variant = [item.size, item.color].filter((v) => v && v !== 'U').join(' / ');
      const display = variant ? name + ' <span style="color:#999;font-size:12px;">(' + variant + ')</span>' : name;
      return '<tr>'
        + '<td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">' + display + '</td>'
        + '<td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#555;">' + item.quantity + '</td>'
        + '<td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:700;color:#111;">$' + Number(item.unitPrice).toLocaleString('es-CO') + '</td>'
        + '</tr>';
    }).join('');

    const createdDate = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

    const body = '<h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#111;letter-spacing:-0.5px;">Pedido confirmado</h1>'
      + '<p style="margin:0 0 24px;font-size:14px;color:#666;">Orden <strong>#' + order.id + '</strong> &mdash; ' + createdDate + '</p>'
      + '<p style="margin:0 0 20px;font-size:15px;color:#333;">Hola <strong>' + (order.user?.name ?? '') + '</strong>, tu pago fue aprobado. Aqui el resumen de tu compra:</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eee;">'
      + '<thead><tr style="background:#111;">'
      + '<th style="padding:10px 12px;text-align:left;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#fff;font-weight:700;">Producto</th>'
      + '<th style="padding:10px 12px;text-align:center;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#fff;font-weight:700;">Cant.</th>'
      + '<th style="padding:10px 12px;text-align:right;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#fff;font-weight:700;">Precio</th>'
      + '</tr></thead>'
      + '<tbody>' + itemRows + '</tbody>'
      + '<tfoot><tr style="background:#f9f9f9;">'
      + '<td colspan="2" style="padding:14px 12px;font-size:13px;font-weight:700;color:#555;border-top:2px solid #111;">TOTAL</td>'
      + '<td style="padding:14px 12px;text-align:right;font-size:18px;font-weight:900;color:#111;border-top:2px solid #111;">$' + Number(order.total).toLocaleString('es-CO') + '</td>'
      + '</tr></tfoot>'
      + '</table>'
      + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:#f9f9f9;border-left:3px solid #c8102e;">'
      + '<tr><td style="padding:16px;">'
      + '<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Direccion de envio</p>'
      + '<p style="margin:0;font-size:14px;color:#333;">' + (order.shippingAddress ?? '') + ', ' + (order.shippingCity ?? '') + '</p>'
      + (order.shippingPhone ? '<p style="margin:4px 0 0;font-size:13px;color:#666;">Tel: ' + order.shippingPhone + '</p>' : '')
      + '</td></tr>'
      + '</table>'
      + '<p style="margin:24px 0 0;font-size:13px;color:#888;line-height:1.6;">Te notificaremos cuando tu pedido sea enviado. Si tienes preguntas escribe a <a href="mailto:soporte@proshopbaq.com.co" style="color:#c8102e;text-decoration:none;font-weight:700;">soporte@proshopbaq.com.co</a>.</p>';

    const html = buildEmail('Pedido #' + order.id + ' confirmado - Pro Shop', 'Tu pago fue aprobado. Aqui el resumen de tu pedido.', body);

    try {
      await this.transporter.sendMail({ from: this.from, to, subject: 'Pro Shop - Pedido #' + order.id + ' confirmado', html });
      this.logger.log('Confirmacion enviada a ' + to);
    } catch (err) {
      this.logger.error('Error confirmacion: ' + (err as Error).message);
    }
  }

  async sendShippingUpdate(order: Order): Promise<void> {
    const to = order.user?.email;
    if (!to) return;

    const trackingBlock = order.trackingNumber
      ? '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111;margin-bottom:20px;">'
        + '<tr>'
        + '<td style="padding:20px 24px;">'
        + '<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.5);">Numero de guia</p>'
        + '<p style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:1px;">' + order.trackingNumber + '</p>'
        + '</td>'
        + '<td align="right" style="padding:20px 24px;">'
        + '<span style="display:inline-block;width:12px;height:12px;background:#c8102e;border-radius:50%;margin-right:6px;"></span>'
        + '<span style="font-size:12px;color:rgba(255,255,255,0.6);">En transito</span>'
        + '</td>'
        + '</tr>'
        + '</table>'
      : '';

    const body = '<h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#111;">Tu pedido va en camino</h1>'
      + '<p style="margin:0 0 24px;font-size:14px;color:#666;">Orden <strong>#' + order.id + '</strong></p>'
      + '<p style="margin:0 0 20px;font-size:15px;color:#333;">Hola <strong>' + (order.user?.name ?? '') + '</strong>, tu pedido ya fue despachado.</p>'
      + trackingBlock
      + '<p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.7;">Puedes revisar el estado de tu pedido en el historial de compras de la plataforma.</p>'
      + '<p style="margin:0;font-size:13px;color:#888;">Preguntas: <a href="mailto:soporte@proshopbaq.com.co" style="color:#c8102e;text-decoration:none;font-weight:700;">soporte@proshopbaq.com.co</a></p>';

    const html = buildEmail('Tu pedido #' + order.id + ' fue enviado - Pro Shop', 'Tu pedido ya esta en camino.', body);

    try {
      await this.transporter.sendMail({ from: this.from, to, subject: 'Pro Shop - Pedido #' + order.id + ' en camino', html });
      this.logger.log('Envio notificado a ' + to);
    } catch (err) {
      this.logger.error('Error envio: ' + (err as Error).message);
    }
  }

  async sendProductNotification(opts: ProductNotificationOpts): Promise<void> {
    const { toEmail, toName, product, message } = opts;

    const imageBlock = product.imageUrl
      ? '<img src="' + product.imageUrl + '" alt="' + product.name + '" width="100%" style="display:block;max-width:528px;height:auto;margin-bottom:20px;object-fit:cover;">'
      : '';
    const customMsg = message
      ? '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border-left:3px solid #111;margin-bottom:24px;"><tr><td style="padding:16px 20px;font-size:14px;color:#333;line-height:1.7;">' + message + '</td></tr></table>'
      : '';
    const descBlock = product.description
      ? '<p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">' + product.description + '</p>'
      : '';

    const body = '<h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#111;">Hola ' + toName + '</h1>'
      + customMsg
      + imageBlock
      + '<h2 style="margin:0 0 8px;font-size:20px;font-weight:900;color:#111;">' + product.name + '</h2>'
      + descBlock
      + '<p style="margin:0 0 24px;font-size:28px;font-weight:900;color:#111;">$' + Number(product.price).toLocaleString('es-CO') + '</p>'
      + '<a href="https://proshopbaq.com.co" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 28px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">VER EN PRO SHOP</a>';

    const html = buildEmail(product.name + ' - Pro Shop', product.name + ' disponible en Pro Shop.', body);

    try {
      await this.transporter.sendMail({ from: this.from, to: toEmail, subject: 'Pro Shop - ' + product.name, html });
      this.logger.log('Email producto enviado a ' + toEmail);
    } catch (err) {
      this.logger.error('Error email producto: ' + (err as Error).message);
      throw err;
    }
  }

  async sendOrderMessage(opts: OrderMessageOpts): Promise<void> {
    const { toEmail, toName, orderId, subject, message } = opts;

    const body = '<h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#111;">Mensaje sobre tu pedido</h1>'
      + '<p style="margin:0 0 24px;font-size:14px;color:#666;">Orden <strong>#' + orderId + '</strong></p>'
      + '<p style="margin:0 0 20px;font-size:15px;color:#333;">Hola <strong>' + toName + '</strong>,</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border-left:3px solid #c8102e;margin-bottom:24px;">'
      + '<tr><td style="padding:20px 24px;font-size:14px;color:#333;line-height:1.8;">' + message.replace(/\n/g, '<br>') + '</td></tr>'
      + '</table>'
      + '<p style="margin:0;font-size:13px;color:#888;">Puedes responder a este correo o escribirnos a <a href="mailto:soporte@proshopbaq.com.co" style="color:#c8102e;text-decoration:none;font-weight:700;">soporte@proshopbaq.com.co</a>.</p>';

    const html = buildEmail('Mensaje sobre pedido #' + orderId + ' - Pro Shop', subject, body);

    await this.transporter.sendMail({ from: this.from, to: toEmail, subject: 'Pro Shop - ' + subject, html });
    this.logger.log('Mensaje de orden #' + orderId + ' enviado a ' + toEmail);
  }


  async sendSupportMessage(opts: SupportMessageOpts): Promise<void> {
    const { fromName, fromEmail, message, orderId, order } = opts;
    const supportEmail = this.config.get<string>('SUPPORT_EMAIL', 'soporte@proshopbaq.com.co');
    const orderRef = orderId ? ' (Pedido #' + orderId + ')' : '';

    // When no order: show basic client info + message
    const clientBlock = order
      ? ''
      : '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;margin-bottom:20px;">'
        + '<tr><td style="padding:14px 20px;border-bottom:1px solid #eee;">'
        + '<span style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Cliente</span><br>'
        + '<span style="font-size:14px;color:#111;font-weight:700;">' + fromName + '</span>'
        + '</td></tr>'
        + '<tr><td style="padding:14px 20px;">'
        + '<span style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#999;">Email</span><br>'
        + '<a href="mailto:' + fromEmail + '" style="font-size:14px;color:#c8102e;font-weight:700;text-decoration:none;">' + fromEmail + '</a>'
        + '</td></tr>'
        + '</table>';

    // Standalone message block (used only when no order)
    const standaloneMessage = order
      ? ''
      : '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border:1px solid #eee;margin-bottom:20px;">'
        + '<tr><td style="padding:4px 0;"><div style="height:3px;background:#c8102e;"></div></td></tr>'
        + '<tr><td style="padding:20px 24px;font-size:14px;color:#333;line-height:1.8;">' + message.replace(/\n/g, '<br>') + '</td></tr>'
        + '</table>';

    // Message integrated as a card inside the order summary flow
    const messageCard = order
      ? '<p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#999;border-bottom:1px solid #eee;padding-bottom:8px;">MENSAJE DEL CLIENTE</p>'
        + '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e5e5e5;margin-bottom:20px;">'
        + '<tr><td style="background:#111;padding:10px 16px;"><span style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.6);">' + fromName + ' &mdash; <a href="mailto:' + fromEmail + '" style="color:#c8102e;text-decoration:none;">' + fromEmail + '</a></span></td></tr>'
        + '<tr><td style="padding:16px;font-size:14px;color:#333;line-height:1.8;">' + message.replace(/\n/g, '<br>') + '</td></tr>'
        + '</table>'
      : '';

    const orderSummaryBlock = order ? buildOrderSummaryHtml(order) : '';
    const clientProfileBlock = order ? buildClientProfileHtml(order) : '';

    const sectionTitle = order
      ? '<p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#999;border-bottom:1px solid #eee;padding-bottom:8px;">RESUMEN DEL PEDIDO</p>'
      : '';
    const profileTitle = order
      ? '<p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#999;border-bottom:1px solid #eee;padding-bottom:8px;">DATOS DEL CLIENTE</p>'
      : '';

    const body = '<h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#111;">Nuevo mensaje de soporte' + orderRef + '</h1>'
      + '<p style="margin:0 0 24px;font-size:14px;color:#666;">' + new Date().toLocaleString('es-CO') + '</p>'
      + messageCard
      + clientBlock
      + standaloneMessage
      + sectionTitle
      + orderSummaryBlock
      + profileTitle
      + clientProfileBlock
      + '<p style="margin:20px 0 0;font-size:13px;color:#888;">Responde directamente a <a href="mailto:' + fromEmail + '" style="color:#c8102e;text-decoration:none;">' + fromEmail + '</a></p>';

    const html = buildEmail('Soporte Proshop' + orderRef + ' - ' + fromName, 'Mensaje de ' + fromName + ' (' + fromEmail + ')', body);

    await this.transporter.sendMail({
      from: this.from,
      to: supportEmail,
      subject: 'Soporte Proshop' + orderRef + ' - ' + fromName,
      html,
    });
    this.logger.log('Mensaje de soporte de ' + fromEmail);
  }
}
