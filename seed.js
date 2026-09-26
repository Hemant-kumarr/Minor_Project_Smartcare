/**
 * SmartCare AI – Database Seed Script
 * Run: node seed.js
 * Seeds 1 admin, 2 patients, 10 doctors with availability
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Availability = require('./models/Availability');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');

const connectDB = require('./config/db');

// ── Seed Data ──────────────────────────────────────────────────────────────
const adminData = {
  name: 'Admin SmartCare',
  email: 'admin@smartcare.com',
  password: 'admin123',
  role: 'admin',
  phone: '9000000001'
};

const patientData = [
  {
    name: 'Rahul Sharma',
    email: 'patient@demo.com',
    password: 'demo123',
    role: 'patient',
    phone: '9876543210',
    dateOfBirth: new Date('1995-06-15'),
    gender: 'male'
  },
  {
    name: 'Priya Mehta',
    email: 'priya@demo.com',
    password: 'demo123',
    role: 'patient',
    phone: '9876543211',
    dateOfBirth: new Date('1998-03-22'),
    gender: 'female'
  }
];

const doctorData = [
  {
    user: { name: 'Dr. Arjun Sharma', email: 'dr.sharma@demo.com', phone: '9800000001' },
    profile: { specialization: 'General Physician', qualification: 'MBBS, MD – Internal Medicine', experience: 12, medicalRegistrationNumber: 'MH-10234', consultationFee: 400, clinicName: 'City Health Clinic', about: 'Experienced general physician with expertise in diagnosing and treating common illnesses, chronic conditions, and preventive care.' }
  },
  {
    user: { name: 'Dr. Sneha Patel', email: 'dr.patel@demo.com', phone: '9800000002' },
    profile: { specialization: 'Cardiologist', qualification: 'MBBS, MD – Cardiology, DM', experience: 15, medicalRegistrationNumber: 'GJ-20567', consultationFee: 800, clinicName: 'Heart Care Centre', about: 'Senior cardiologist specialising in heart disease prevention, diagnosis, and management of complex cardiac conditions.' }
  },
  {
    user: { name: 'Dr. Kavya Reddy', email: 'dr.reddy@demo.com', phone: '9800000003' },
    profile: { specialization: 'Dermatologist', qualification: 'MBBS, MD – Dermatology', experience: 8, medicalRegistrationNumber: 'AP-30891', consultationFee: 500, clinicName: 'SkinCare Clinic', about: 'Dermatologist with expertise in acne, eczema, psoriasis, hair loss, and cosmetic skin treatments.' }
  },
  {
    user: { name: 'Dr. Rohit Gupta', email: 'dr.gupta@demo.com', phone: '9800000004' },
    profile: { specialization: 'Pediatrician', qualification: 'MBBS, MD – Pediatrics', experience: 10, medicalRegistrationNumber: 'DL-40123', consultationFee: 450, clinicName: 'Little Stars Clinic', about: 'Dedicated pediatrician providing comprehensive care for infants, children, and adolescents including vaccinations and development monitoring.' }
  },
  {
    user: { name: 'Dr. Meera Nair', email: 'dr.nair@demo.com', phone: '9800000005' },
    profile: { specialization: 'Gynecologist', qualification: 'MBBS, MS – Obstetrics & Gynecology', experience: 14, medicalRegistrationNumber: 'KL-50456', consultationFee: 600, clinicName: 'Women\'s Health Centre', about: 'Obstetrician and gynecologist specialising in women\'s reproductive health, pregnancy, and hormonal disorders.' }
  },
  {
    user: { name: 'Dr. Vikram Singh', email: 'dr.vikram@demo.com', phone: '9800000006' },
    profile: { specialization: 'Orthopedic', qualification: 'MBBS, MS – Orthopedics', experience: 11, medicalRegistrationNumber: 'RJ-60789', consultationFee: 700, clinicName: 'Bone & Joint Clinic', about: 'Orthopedic surgeon with expertise in joint replacement, sports injuries, spine disorders, and fracture management.' }
  },
  {
    user: { name: 'Dr. Ananya Krishnan', email: 'dr.ananya@demo.com', phone: '9800000007' },
    profile: { specialization: 'Neurologist', qualification: 'MBBS, MD – Neurology, DM', experience: 13, medicalRegistrationNumber: 'TN-70012', consultationFee: 750, clinicName: 'Neuro Care Hospital', about: 'Neurologist specialising in headaches, epilepsy, stroke, Parkinson\'s disease and neurodegenerative conditions.' }
  },
  {
    user: { name: 'Dr. Suresh Iyer', email: 'dr.suresh@demo.com', phone: '9800000008' },
    profile: { specialization: 'Psychiatrist', qualification: 'MBBS, MD – Psychiatry', experience: 9, medicalRegistrationNumber: 'MH-80345', consultationFee: 650, clinicName: 'Mind Wellness Centre', about: 'Psychiatrist providing compassionate care for anxiety, depression, stress disorders, insomnia, and other mental health conditions.' }
  },
  {
    user: { name: 'Dr. Pooja Agarwal', email: 'dr.pooja@demo.com', phone: '9800000009' },
    profile: { specialization: 'Dermatologist', qualification: 'MBBS, DVD – Dermatology', experience: 6, medicalRegistrationNumber: 'UP-90678', consultationFee: 400, clinicName: 'Glow Skin Clinic', about: 'Dermatologist with special interest in acne treatment, pigmentation, hair fall, and skin allergy management.' }
  },
  {
    user: { name: 'Dr. Rajesh Kumar', email: 'dr.rajesh@demo.com', phone: '9800000010' },
    profile: { specialization: 'General Physician', qualification: 'MBBS, PGDM – Diabetology', experience: 18, medicalRegistrationNumber: 'HR-00901', consultationFee: 350, clinicName: 'Family Health Hub', about: 'General physician and diabetologist with 18 years of experience in managing diabetes, hypertension, thyroid disorders, and preventive healthcare.' }
  }
];

const availabilityTemplates = {
  weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  morning: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
  afternoon: ['02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'],
  evening: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'],
  saturday: ['Saturday'],
  satSlots: ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM']
};

// ── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log('\n🌱 Starting SmartCare AI database seed...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Availability.deleteMany({}),
      Appointment.deleteMany({}),
      Prescription.deleteMany({})
    ]);
    console.log('✅ Existing data cleared.\n');

    // Create Admin
    console.log('👤 Creating admin account...');
    await User.create(adminData);
    console.log(`   ✅ Admin: ${adminData.email} / ${adminData.password}`);

    // Create Patients
    console.log('\n👥 Creating patient accounts...');
    const createdPatients = [];
    for (const p of patientData) {
      const user = await User.create(p);
      createdPatients.push(user);
      console.log(`   ✅ Patient: ${p.email} / ${p.password}`);
    }

    // Create Doctors + Availability
    console.log('\n🩺 Creating doctor accounts...');
    const createdDoctors = [];
    for (let i = 0; i < doctorData.length; i++) {
      const d = doctorData[i];

      // Create user
      const user = await User.create({
        ...d.user,
        password: 'demo123',
        role: 'doctor'
      });

      // Create doctor profile
      const doctor = await Doctor.create({
        userId: user._id,
        ...d.profile,
        verificationStatus: 'approved',
        rating: (4.0 + Math.random() * 0.9).toFixed(1),
        totalReviews: Math.floor(20 + Math.random() * 80)
      });

      createdDoctors.push({ user, doctor });

      // Create availability (alternate between morning/afternoon schedules)
      const useAfternoon = i % 2 === 0;
      const slots = useAfternoon ? availabilityTemplates.afternoon : availabilityTemplates.morning;
      const days = availabilityTemplates.weekdays;

      for (const day of days) {
        await Availability.create({
          doctorId: doctor._id,
          day,
          slots: slots.map(t => ({ time: t, isBooked: false })),
          isActive: true
        });
      }

      // Add Saturday for some doctors
      if (i < 5) {
        await Availability.create({
          doctorId: doctor._id,
          day: 'Saturday',
          slots: availabilityTemplates.satSlots.map(t => ({ time: t, isBooked: false })),
          isActive: true
        });
      }

      console.log(`   ✅ Doctor: ${d.user.email} / demo123 (${d.profile.specialization})`);
    }

    // Create sample appointments
    console.log('\n📅 Creating sample appointments...');
    const today = new Date();
    const futureDate1 = new Date(today);
    futureDate1.setDate(today.getDate() + 3);
    const futureDate2 = new Date(today);
    futureDate2.setDate(today.getDate() + 7);
    const pastDate1 = new Date(today);
    pastDate1.setDate(today.getDate() - 5);
    const pastDate2 = new Date(today);
    pastDate2.setDate(today.getDate() - 10);

    const toDateStr = (d) => d.toISOString().split('T')[0];
    const getDayName = (d) => d.toLocaleDateString('en-US', { weekday: 'long' });

    const appointmentSeeds = [
      {
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0].doctor._id,
        date: toDateStr(futureDate1),
        time: '10:00 AM',
        dayOfWeek: getDayName(futureDate1),
        reason: 'Persistent fever and headache for 3 days',
        status: 'confirmed'
      },
      {
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[2].doctor._id,
        date: toDateStr(futureDate2),
        time: '02:00 PM',
        dayOfWeek: getDayName(futureDate2),
        reason: 'Skin rash and itching on arms',
        status: 'pending'
      },
      {
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[1].doctor._id,
        date: toDateStr(pastDate1),
        time: '02:30 PM',
        dayOfWeek: getDayName(pastDate1),
        reason: 'Chest discomfort and shortness of breath',
        status: 'completed'
      },
      {
        patientId: createdPatients[1]._id,
        doctorId: createdDoctors[4].doctor._id,
        date: toDateStr(futureDate1),
        time: '10:30 AM',
        dayOfWeek: getDayName(futureDate1),
        reason: 'Routine check-up and consultation',
        status: 'confirmed'
      },
      {
        patientId: createdPatients[1]._id,
        doctorId: createdDoctors[3].doctor._id,
        date: toDateStr(pastDate2),
        time: '09:00 AM',
        dayOfWeek: getDayName(pastDate2),
        reason: 'Child vaccination and growth check',
        status: 'completed'
      }
    ];

    const createdAppts = [];
    for (const appt of appointmentSeeds) {
      const a = await Appointment.create(appt);
      createdAppts.push(a);
    }
    console.log(`   ✅ ${createdAppts.length} appointments created.`);

    // Create sample prescription for completed appointment
    console.log('\n💊 Creating sample prescription...');
    const completedAppt = createdAppts.find(a => a.status === 'completed' && String(a.patientId) === String(createdPatients[0]._id));
    if (completedAppt) {
      await Prescription.create({
        appointmentId: completedAppt._id,
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[1].doctor._id,
        diagnosis: 'Atypical chest pain – likely musculoskeletal in origin. ECG and BP normal.',
        medicines: [
          { medicineName: 'Ibuprofen 400mg', dosage: '1 Tablet', frequency: 'Twice Daily', duration: '5 Days', instructions: 'After Food' },
          { medicineName: 'Pantoprazole 40mg', dosage: '1 Tablet', frequency: 'Once Daily', duration: '7 Days', instructions: 'Before Breakfast' },
          { medicineName: 'Muscle Relaxant (Thiocolchicoside 4mg)', dosage: '1 Tablet', frequency: 'Twice Daily', duration: '3 Days', instructions: 'After Food' }
        ],
        doctorNotes: 'Avoid strenuous activity for 1 week. Follow up if chest pain recurs or worsens. Get Echo done if symptoms persist.',
        followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
      console.log('   ✅ Sample prescription created.');
    }

    // Summary
    console.log('\n' + '═'.repeat(55));
    console.log('✅ Database seeded successfully!\n');
    console.log('📋 DEMO LOGIN CREDENTIALS:');
    console.log('─'.repeat(40));
    console.log('🔑 Admin:');
    console.log(`   Email:    admin@smartcare.com`);
    console.log(`   Password: admin123`);
    console.log('\n🔑 Patient 1:');
    console.log(`   Email:    patient@demo.com`);
    console.log(`   Password: demo123`);
    console.log('\n🔑 Patient 2:');
    console.log(`   Email:    priya@demo.com`);
    console.log(`   Password: demo123`);
    console.log('\n🔑 Doctor (General Physician):');
    console.log(`   Email:    dr.sharma@demo.com`);
    console.log(`   Password: demo123`);
    console.log('\n🔑 Doctor (Cardiologist):');
    console.log(`   Email:    dr.patel@demo.com`);
    console.log(`   Password: demo123`);
    console.log('─'.repeat(40));
    console.log('(All 10 doctors use password: demo123)');
    console.log('═'.repeat(55) + '\n');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error. Run seed again after clearing DB.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
}

seed();
