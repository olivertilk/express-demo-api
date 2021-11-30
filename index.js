const express = require('express');
const app = express();
const Joi = require('joi');

app.use(express.json());

const doctors = [
  { id: 1, firstName: 'Julius', lastName: 'Hibbert' },
  { id: 2, firstName: 'Algernop', lastName: 'Krieger' },
  { id: 3, firstName: 'Nick', lastName: 'Riviera' },
];

//Counter for the next appointment ID in the database
let appointmentCounter = 10;
const appointments = [
  { id: 1, doctorId: 1, patientFirstName: "Patient", patientLastName: "One", dateTime: new Date(2018, 4, 9, 9, 30), kind: "New Patient" },
  { id: 2, doctorId: 2, patientFirstName: "Sterling", patientLastName: "Archer", dateTime: new Date(2018, 4, 9, 8, 0), kind: "New Patient" },
  { id: 3, doctorId: 3, patientFirstName: "Patient", patientLastName: "Four", dateTime: new Date(2018, 4, 9, 10, 0), kind: "New Patient" },
  { id: 4, doctorId: 2, patientFirstName: "Cyril", patientLastName: "Figis", dateTime: new Date(2018, 4, 9, 8, 30), kind: "Follow-up" },
  { id: 5, doctorId: 2, patientFirstName: "Ray", patientLastName: "Gilette", dateTime: new Date(2018, 4, 9, 9, 0), kind: "Follow-up" },
  { id: 6, doctorId: 2, patientFirstName: "Lana", patientLastName: "Kane", dateTime: new Date(2018, 4, 9, 9, 30), kind: "New Patient" },
  { id: 7, doctorId: 2, patientFirstName: "Pam", patientLastName: "Poovey", dateTime: new Date(2018, 4, 9, 10, 0), kind: "New Patient" },
  { id: 8, doctorId: 1, patientFirstName: "Patient", patientLastName: "Two", dateTime: new Date(2018, 4, 9, 10, 0), kind: "New Patient" },
  { id: 9, doctorId: 3, patientFirstName: "Patient", patientLastName: "Three", dateTime: new Date(2018, 4, 9, 9, 30), kind: "New Patient" },
];

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.get('/api/doctors', (req, res) => {
  res.send(doctors);
});

app.get('/api/doctors/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const doctor = doctors.find(doctor => doctor.id === id);

  if (!doctor) return res.status(404).send("Doctor not found");

  res.send(doctor);
});

app.get('/api/doctors/:doctorId/appointments/:year/:month/:day', (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  const doctor = doctors.find(doctor => doctor.id === doctorId);

  if (!doctor) return res.status(404).send("Doctor not found");

  const requestYear = parseInt(req.params.year);
  const requestMonth = parseInt(req.params.month);
  const requestDay = parseInt(req.params.day);

  //Search appointments for the requested doctor and day
  const outputAppointments = appointments.filter((appointment) => {
    if (appointment.doctorId === doctorId &&
      appointment.dateTime.getFullYear() === requestYear &&
      appointment.dateTime.getMonth() === requestMonth - 1 &&
      appointment.dateTime.getDate() === requestDay) {
      return true;
    }

    return false;
  });

  //Format appointments for the response
  const formattedAppointments = outputAppointments.map((appointment, i) => {
    return {
      id: appointment.id,
      dayId: i + 1,
      name: appointment.patientFirstName + " " + appointment.patientLastName,
      time: appointment.dateTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
      kind: appointment.kind
    };
  });

  res.send(formattedAppointments);
});

app.post('/api/doctors/:doctorId/appointments/:year/:month/:day', (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  const doctor = doctors.find(doctor => doctor.id === doctorId);

  if (!doctor) return res.status(404).send("Doctor not found");

  const requestYear = parseInt(req.params.year);
  const requestMonth = parseInt(req.params.month);
  const requestDay = parseInt(req.params.day);

  const requestMinutes = parseInt(req.body.minutes);
  if (requestMinutes % 15 !== 0) return res.status(400).send("Appointments can only start at 15 minute intervals.");

  let requestHour = parseInt(req.body.hour);
  const requestAMPM = req.body.ampm;
  if (requestAMPM === "PM") {
    requestHour += 12;
  }

  const requestDateTime = new Date(requestYear, requestMonth - 1, requestDay, requestHour, requestMinutes);
  let count = 0;
  for (let appointment of appointments) {
    if (appointment.doctorId === doctorId && appointment.dateTime.getTime() === requestDateTime.getTime()) {
      count++;
      if (count === 3) {
        return res.status(400).send("No more than 3 appointments can be added with the same time for a given doctor.");
      }
    }
  }

  const newAppointment = {
    id: appointmentCounter,
    doctorId: doctorId,
    patientFirstName: req.body.firstName,
    patientLastName: req.body.lastName,
    dateTime: new Date(requestYear, requestMonth - 1, requestDay, requestHour, requestMinutes),
    kind: req.body.kind
  };

  appointmentCounter++;

  appointments.push(newAppointment);

  res.send(newAppointment);
});

app.delete('/api/doctors/:doctorId/appointments/:year/:month/:day/:appointmentId', (req, res) => {
  const doctorId = parseInt(req.params.doctorId);
  const doctor = doctors.find(doctor => doctor.id === doctorId);

  if (!doctor) return res.status(404).send("Doctor not found");

  const appointmentId = parseInt(req.params.appointmentId);

  const index = appointments.findIndex(appointment => appointment.id === appointmentId);
  if (index < 0) return res.status(404).send("Appointment doesn't exist.");

  appointments.splice(index, 1);

  res.status(200).send('Deleted appointment with id ' + appointmentId);
});

//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});