import { executeQuery } from "../db/executeQuery.js";

export function Admin() {
  this.created_date = undefined;
  this.first_name = "";
  this.last_name = "";
  this.password = "";
  this.email = "";
  this.id = 0;

  this.newEventFromRequestBody = function (body) {
    this.first_name = body.first_name;
    this.last_name = body.last_name;
    this.password = body.password;
    this.email = body.email;
  };

  // Will save a new admin to the database from the request body
  this.save = async function () {
    const { results } = await executeQuery(
      `INSERT INTO admins (first_name, last_name, password, email)
      VALUES (?, ?, ?, ?)`,
      [this.first_name, this.last_name, this.password, this.email]
    );

    return { results, success: true };
  };

  this.update = async function () {
    const { results } = await executeQuery(
      `UPDATE admins SET first_name = ?, last_name = ?, email = ?
      WHERE id = ?`,
      [this.first_name, this.last_name, this.email, this.id]
    );

    return { results, success: true };
  };

  // Will get a single admin by id
  this.getSingleEventById = async function () {
    const { results } = await executeQuery(
      `SELECT * FROM admins WHERE id = ?`,
      [this.id]
    );

    return results[0];
  };

  // Delete an event from the database
  this.delete = async function () {
    const { results } = await executeQuery(
      `DELETE FROM admins WHERE id = ? AND admin_id = ?`,
      [this.id, this.admin_id]
    );

    return { results, success: true };
  };
}
