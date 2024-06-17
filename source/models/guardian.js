import { executeQuery } from "../db/executeQuery.js";

export function Guardian() {
  this.phone_number = undefined;
  this.first_name = "";
  this.last_name = "";
  this.id = 0;

  this.add = function () {
    // const { results } = await executeQuery(
    //   "INSERT INTO registrant (guardian_phone_number, guardian_first_name, guardian_last_name, first_name, last_name, checked_in, age) VALUES (?, ?, ?, ?, ?, ?, ?)",
    //   [
    //     this.guardianPhoneNumber,
    //     this.guardianFirstName,
    //     this.guardianLastName,
    //     this.firstName,
    //     this.lastName,
    //     this.checkIn,
    //     this.age,
    //   ]
    // );
    // return results;

    return { success: true };
  };
}
