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
  };

  this.save = async function () {
    const { results } = await executeQuery(
      `INSERT INTO guardian (registrant_id, phone_number, first_name, last_name)
      VALUES (?, ?, ?, ?)`,
      [this.registrant_id, this.phone_number, this.first_name, this.last_name]
    );

    return { results, success: true };
  };
}
