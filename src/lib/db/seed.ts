/**
 * Database seed script — creates demo data for development.
 * Run with: npm run db:seed
 */
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./connect";
import Organization from "../../models/Organization";
import User from "../../models/User";
import Site from "../../models/Site";
import Form from "../../models/Form";
import Submission from "../../models/Submission";

const DEMO_ORG_NAME = "Acme Field Ops";
const DEMO_SLUG = "acme-field-ops-demo";

async function seed() {
  await connectDB();
  console.log("🌱 Starting database seed...\n");

  // ── Clean existing demo data ──────────────────────────────────────────────
  const existingOrg = await Organization.findOne({ slug: DEMO_SLUG });
  if (existingOrg) {
    await Promise.all([
      User.deleteMany({ organizationId: existingOrg._id }),
      Site.deleteMany({ organizationId: existingOrg._id }),
      Form.deleteMany({ organizationId: existingOrg._id }),
      Submission.deleteMany({ organizationId: existingOrg._id }),
      Organization.deleteOne({ _id: existingOrg._id }),
    ]);
    console.log("🗑  Cleared existing demo data");
  }

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await Organization.create({
    name: DEMO_ORG_NAME,
    slug: DEMO_SLUG,
    plan: "pro",
    settings: { allowSelfRegistration: false, maxUsers: 50, maxSites: 20, maxForms: 100 },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ── Users ─────────────────────────────────────────────────────────────────
  const [admin, manager, staff1, staff2] = (await User.create([
    {
      name: "Alice Admin",
      email: "admin@demo.fieldops.dev",
      password: "Demo@1234",
      role: "admin",
      organizationId: org._id,
    },
    {
      name: "Mike Manager",
      email: "manager@demo.fieldops.dev",
      password: "Demo@1234",
      role: "manager",
      organizationId: org._id,
    },
    {
      name: "Sam Staff",
      email: "staff@demo.fieldops.dev",
      password: "Demo@1234",
      role: "staff",
      organizationId: org._id,
    },
    {
      name: "Taylor Tech",
      email: "staff2@demo.fieldops.dev",
      password: "Demo@1234",
      role: "staff",
      organizationId: org._id,
    },
  ])) as any[];
  console.log("✅ Users: admin, manager, staff x2");

  // ── Sites ─────────────────────────────────────────────────────────────────
  const [siteA, siteB, siteC] = (await Site.create([
    {
      name: "Downtown Warehouse",
      description: "Main distribution center — 3 floors, 120,000 sq ft",
      location: { city: "Chicago", state: "IL", country: "USA", lat: 41.8781, lng: -87.6298 },
      organizationId: org._id,
      managerId: manager._id,
    },
    {
      name: "Northside Facility",
      description: "Secondary processing and QA facility",
      location: { city: "Chicago", state: "IL", country: "USA", lat: 41.9742, lng: -87.6597 },
      organizationId: org._id,
      managerId: manager._id,
    },
    {
      name: "South Industrial Park",
      description: "Heavy equipment and vehicle storage",
      location: { city: "Chicago", state: "IL", country: "USA", lat: 41.7508, lng: -87.6439 },
      organizationId: org._id,
    },
  ])) as any[];
  console.log("✅ Sites: 3 created");

  // ── Forms ─────────────────────────────────────────────────────────────────
  const safetyForm = await Form.create({
    title: "Daily Safety Inspection",
    description: "Complete this checklist at the start of each shift",
    organizationId: org._id,
    siteId: siteA._id,
    createdBy: admin._id,
    fields: [
      { id: "f1", type: "text", label: "Inspector Name", required: true, order: 0 },
      { id: "f2", type: "dropdown", label: "Shift", required: true, order: 1, options: ["Morning", "Afternoon", "Night"] },
      { id: "f3", type: "checkbox", label: "Safety Equipment Checked", required: true, order: 2, options: ["Hard Hat", "Safety Vest", "Steel-toed Boots", "Gloves"] },
      { id: "f4", type: "number", label: "Temperature (°F)", required: false, order: 3, validation: { min: -20, max: 120 } },
      { id: "f5", type: "dropdown", label: "Overall Safety Rating", required: true, order: 4, options: ["Excellent", "Good", "Fair", "Poor", "Critical"] },
      { id: "f6", type: "textarea", label: "Issues or Observations", required: false, order: 5, placeholder: "Describe any safety concerns..." },
    ],
    settings: { allowMultipleSubmissions: true, requiresApproval: false, notifyOnSubmission: true, successMessage: "Safety inspection recorded. Thank you!" },
  });

  const maintenanceForm = await Form.create({
    title: "Equipment Maintenance Log",
    description: "Record all equipment maintenance activities",
    organizationId: org._id,
    siteId: siteA._id,
    createdBy: manager._id,
    fields: [
      { id: "m1", type: "text", label: "Equipment ID", required: true, order: 0 },
      { id: "m2", type: "text", label: "Equipment Name", required: true, order: 1 },
      { id: "m3", type: "dropdown", label: "Maintenance Type", required: true, order: 2, options: ["Preventive", "Corrective", "Emergency", "Routine Inspection"] },
      { id: "m4", type: "date", label: "Last Maintenance Date", required: true, order: 3 },
      { id: "m5", type: "number", label: "Hours of Operation", required: false, order: 4, validation: { min: 0, max: 100000 } },
      { id: "m6", type: "dropdown", label: "Condition After Maintenance", required: true, order: 5, options: ["Operational", "Needs Follow-up", "Out of Service"] },
      { id: "m7", type: "textarea", label: "Work Performed", required: true, order: 6 },
    ],
    settings: { allowMultipleSubmissions: true, requiresApproval: true, notifyOnSubmission: false, successMessage: "Maintenance log submitted successfully." },
  });

  const incidentForm = await Form.create({
    title: "Incident Report",
    description: "Report workplace incidents, near-misses, and hazards",
    organizationId: org._id,
    siteId: siteB._id,
    createdBy: admin._id,
    fields: [
      { id: "i1", type: "date", label: "Incident Date", required: true, order: 0 },
      { id: "i2", type: "dropdown", label: "Incident Type", required: true, order: 1, options: ["Near Miss", "Minor Injury", "Major Injury", "Property Damage", "Environmental", "Security"] },
      { id: "i3", type: "text", label: "Location of Incident", required: true, order: 2 },
      { id: "i4", type: "textarea", label: "Description of Incident", required: true, order: 3 },
      { id: "i5", type: "dropdown", label: "Severity", required: true, order: 4, options: ["Low", "Medium", "High", "Critical"] },
      { id: "i6", type: "checkbox", label: "Immediate Actions Taken", order: 5, options: ["First Aid Provided", "Area Secured", "Supervisor Notified", "Emergency Services Called"] },
      { id: "i7", type: "textarea", label: "Recommended Preventive Actions", required: false, order: 6 },
    ],
    settings: { allowMultipleSubmissions: true, requiresApproval: true, notifyOnSubmission: true, successMessage: "Incident report filed. A manager will review shortly." },
  });
  console.log("✅ Forms: 3 created (safety, maintenance, incident)");

  // ── Submissions (historical data for analytics) ───────────────────────────
  const ratings = ["Excellent", "Good", "Fair", "Poor", "Critical"];
  const shifts = ["Morning", "Afternoon", "Night"];
  const equipment = ["Forklift-01", "Crane-02", "Conveyor-03", "Pallet Jack-04"];
  const submitters = [staff1._id, staff2._id];

  const submissionDocs: any[] = [];
  const now = new Date();

  // Generate 60 days of safety inspection submissions
  for (let daysAgo = 60; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    const count = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < count; j++) {
      const rating = ratings[Math.floor(Math.random() * ratings.length)]!;
      const isCritical = rating === "Critical" || rating === "Poor";
      submissionDocs.push({
        formId: safetyForm._id,
        siteId: siteA._id,
        organizationId: org._id,
        submittedBy: submitters[Math.floor(Math.random() * submitters.length)],
        data: {
          f1: ["Sam Staff", "Taylor Tech"][Math.floor(Math.random() * 2)],
          f2: shifts[Math.floor(Math.random() * shifts.length)],
          f3: ["Hard Hat", "Safety Vest"],
          f4: Math.floor(Math.random() * 30) + 60,
          f5: rating,
          f6: isCritical ? "Found damaged equipment on floor 2. Tagged for immediate repair." : "",
        },
        status: isCritical ? "flagged" : daysAgo < 5 ? "submitted" : "reviewed",
        aiSummary: isCritical
          ? `Safety inspection flagged critical conditions. ${rating} rating reported with equipment concerns.`
          : `Routine safety inspection completed. ${rating} overall conditions.`,
        aiAnomalies: isCritical ? ["Equipment damage reported requiring immediate attention"] : [],
        createdAt: date,
        updatedAt: date,
      });
    }
  }

  // Generate 30 maintenance submissions
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    submissionDocs.push({
      formId: maintenanceForm._id,
      siteId: siteA._id,
      organizationId: org._id,
      submittedBy: submitters[Math.floor(Math.random() * submitters.length)],
      data: {
        m1: `EQ-${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`,
        m2: equipment[Math.floor(Math.random() * equipment.length)],
        m3: ["Preventive", "Corrective", "Routine Inspection"][Math.floor(Math.random() * 3)],
        m4: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        m5: Math.floor(Math.random() * 5000) + 500,
        m6: ["Operational", "Operational", "Needs Follow-up"][Math.floor(Math.random() * 3)],
        m7: "Routine service completed. All components checked and lubricated.",
      },
      status: Math.random() > 0.3 ? "reviewed" : "submitted",
      createdAt: date,
      updatedAt: date,
    });
  }

  await Submission.insertMany(submissionDocs);

  // Update submission counts
  await Form.findByIdAndUpdate(safetyForm._id, { submissionCount: submissionDocs.filter((s) => String(s.formId) === String(safetyForm._id)).length });
  await Form.findByIdAndUpdate(maintenanceForm._id, { submissionCount: 30 });

  console.log(`✅ Submissions: ${submissionDocs.length} created`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed complete!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Demo Credentials:");
  console.log("  Admin:   admin@demo.fieldops.dev   / Demo@1234");
  console.log("  Manager: manager@demo.fieldops.dev / Demo@1234");
  console.log("  Staff:   staff@demo.fieldops.dev   / Demo@1234");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
