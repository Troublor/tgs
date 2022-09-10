import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export default class User {
  @PrimaryColumn({ type: String })
  email!: string;

  @Column({ type: String, nullable: true })
  name!: string | null;
}
