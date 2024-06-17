import { executeQuery } from "../db/executeQuery.js";

export function Registrant() {
  this.lastCheckTime = new Date();
  this.createdDate = new Date();
  this.guardianPhoneNumber = "";
  this.guardianFirstName = "";
  this.guardianLastName = "";
  this.checkedIn = false;
  this.age = undefined;
  this.id = undefined;
  this.firstName = "";
  this.lastName = "";
  this.gender = -1;

  // get all the registrants
  this.getAllRegistrants = async function () {
    // const { results } = await executeQuery("SELECT * FROM registrant", []);
    // return results;

    return [
      { id: 1, firstName: "John", lastName: "Doe", gender: 1, checkIn: false },
      { id: 2, firstName: "Jane", lastName: "Une", gender: 2, checkIn: true },
      { id: 3, firstName: "Jim", lastName: "three", gender: 1, checkIn: false },
      { id: 4, firstName: "Jill", lastName: "thims", gende: 2, checkIn: true },
    ];
  };

  this.getSingleRegistrantById = async function () {
    // const { results } = await executeQuery("SELECT * FROM registrant WHERE id = ?", [
    //   this.id,
    // ]);
    // return results;

    return {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      checkedIn: false,
    };
  };

  this.newRegistrantFromRequestBody = function (body) {
    this.guardianPhoneNumber = body.guardian_phone_number;
    this.guardianFirstName = body.guardian_first_name;
    this.guardianLastName = body.guardian_last_name;
    this.firstName = body.first_name;
    this.checkedIn = body.checked_in;
    this.lastName = body.last_name;
    this.checkIn = false;
    this.age = body.age;
  };

  this.save = async function () {
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

    return { newRegistrantId: 1, success: true };
  };

  this.checkIn = async function () {
    // const { results } = await executeQuery(
    //   "UPDATE registrant SET checked_in = ? WHERE id = ?",
    //   [this.checkIn, this.id]
    // );
    // return results;

    return { success: true };
  };

  this.checkOut = async function () {
    // const { results } = await executeQuery(
    //   "UPDATE registrant SET checked_in = ? WHERE id = ?",
    //   [this.checkIn, this.id]
    // );
    // return results;

    return { success: true };
  };

  this.deleteRegistrant = async function () {
    // const { results } = await executeQuery("DELETE FROM registrant WHERE id = ?", [
    //   this.id,
    // ]);
    // return results;

    return { success: true };
  };

  return this;
}
