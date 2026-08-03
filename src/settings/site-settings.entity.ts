import { Entity, PrimaryColumn, Column } from 'typeorm';

// Fila unica (id=1): configuracion global del sitio editable desde el Admin Panel.
@Entity('site_settings')
export class SiteSettings {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: null })
  outletDiscountPercent: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  freeShippingThreshold: number | null;
}
