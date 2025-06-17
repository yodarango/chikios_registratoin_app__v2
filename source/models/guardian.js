import { executeQuery } from "../db/executeQuery.js";

export function Guardian() {
  this.registrant_id = undefined;
  this.phone_number = undefined;
  this.first_name = "";
  this.last_name = "";
  this.id = 0;

  this.newGuardianFromRequestBody = function (body) {
    this.phone_number = body.guardian_phone_number;
    this.first_name = body.guardian_first_name;
    this.last_name = body.guardian_last_name;
    this.id = body.id;
    // if there is a guardian id, it should over override the id value, which is less specific. This articularly helpful when sending a registratn and guardian at the same time
    this.id = body.guardian_id;
  };

  this.save = async function () {
    const { results } = await executeQuery(
      `INSERT INTO guardian (registrant_id, phone_number, first_name, last_name)
      VALUES (?, ?, ?, ?)`,
      [this.registrant_id, this.phone_number, this.first_name, this.last_name]
    );

    return { results, success: true };
  };

  this.update = async function () {
    const { results } = await executeQuery(
      `UPDATE guardian 
      SET phone_number = ?, first_name = ?, last_name = ?
      WHERE ID = ? `,
      [this.phone_number, this.first_name, this.last_name, this.id]
    );

    return { results, success: true };
  };

  this.checkIfGuardianExists = async function () {
    const { results } = await executeQuery(
      `SELECT * FROM guardian WHERE id = ?`,
      [this.id]
    );

    return results.length > 0;
  };
}
