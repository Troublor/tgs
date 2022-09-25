import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export default class User {
  @PrimaryColumn({ type: String })
  username!: string;

  @Column({ type: String, nullable: true })
  name!: string | null;

  @Column({ type: String, nullable: true })
  email!: string | null;
}
