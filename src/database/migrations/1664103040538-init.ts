import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1664103040538 implements MigrationInterface {
  name = 'init1664103040538';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user"
                             (
                               "username" character varying NOT NULL,
                               "name"     character varying,
                               "email"    character varying,
                               CONSTRAINT "PK_78a916df40e02a9deb1c4b75edb" PRIMARY KEY ("username")
                             )`);
    await queryRunner.query(`CREATE TABLE "message"
                             (
                               "id"               SERIAL    NOT NULL,
                               "content"          text      NOT NULL,
                               "sentAt"           TIMESTAMP NOT NULL,
                               "receiverUsername" character varying,
                               CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(`CREATE TABLE "chat"
                             (
                               "id"           character varying NOT NULL,
                               "bindAt"       TIMESTAMP         NOT NULL,
                               "userUsername" character varying,
                               CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id")
                             )`);
    await queryRunner.query(`ALTER TABLE "message"
      ADD CONSTRAINT "FK_838b22ffd982823818680c50064" FOREIGN KEY ("receiverUsername") REFERENCES "user" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "chat"
      ADD CONSTRAINT "FK_108f0d6677e283315af8f30151b" FOREIGN KEY ("userUsername") REFERENCES "user" ("username") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chat"
      DROP CONSTRAINT "FK_108f0d6677e283315af8f30151b"`);
    await queryRunner.query(`ALTER TABLE "message"
      DROP CONSTRAINT "FK_838b22ffd982823818680c50064"`);
    await queryRunner.query(`DROP TABLE "chat"`);
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
