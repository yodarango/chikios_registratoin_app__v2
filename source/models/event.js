import { executeQuery } from "../db/executeQuery.js";

export function Event() {
  this.registrant_age_limits = "";
  this.created_date = undefined;
  this.admin_id = undefined;
  this.name = "";
  this.id = 0;

  this.newEventFromRequestBody = function (body) {
    this.registrant_age_limits = body.registrant_age_limits;
    this.admin_id = body.admin_id;
    this.name = body.name;
  };

  // Will save a new event to the database from the request body
  this.save = async function () {
    const { results } = await executeQuery(
      `INSERT INTO events (registrant_age_limits, admin_id, name)
      VALUES (?, ?, ?)`,
      [this.registrant_age_limits, this.admin_id, this.name]
    );

    return { results, success: true };
  };

  this.update = async function () {
    const { results } = await executeQuery(
      `UPDATE events SET registrant_age_limits = ?, name = ?
      WHERE id = ?`,
      [this.registrant_age_limits, this.name, this.id]
    );

    return { results, success: true };
  };

  // Will get all events from the database for a specific admin id
  this.getAllEventsByAdminId = async function () {
    const { results } = await executeQuery(
      `SELECT * FROM events WHERE admin_id = ?`,
      [this.admin_id]
    );

    return results;
  };

  // Will get a single event by id
  this.getSingleEventById = async function () {
    const { results } = await executeQuery(
      `SELECT * FROM events WHERE id = ?`,
      [this.id]
    );

    return results[0];
  };

  // Delete an event from the database
  this.delete = async function () {
    const { results } = await executeQuery(
      `DELETE FROM events WHERE id = ? AND admin_id = ?`,
      [this.id, this.admin_id]
    );

    return { results, success: true };
  };
}
