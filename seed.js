const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/property-crm';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  // User Schema (inline for seed)
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'manager', 'agent'], default: 'agent' },
  }, { timestamps: true });

  const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    propertyInterest: { type: String, required: true },
    budget: { type: String, required: true },
    status: { type: String, enum: ['new', 'contacted', 'qualified', 'negotiation', 'closed-won', 'closed-lost'], default: 'new' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' },
    score: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
    followUpDate: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
  }, { timestamps: true });

  const activitySchema = new mongoose.Schema({
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    description: { type: String, required: true },
  }, { timestamps: true });

  const User = mongoose.models.User || mongoose.model('User', userSchema);
  const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
  const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

  // Clear existing data
  await User.deleteMany({});
  await Lead.deleteMany({});
  await Activity.deleteMany({});
  console.log('Cleared existing data');

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@propertycrm.com',
    password: adminPassword,
    role: 'admin',
  });
  console.log('Created Admin: admin@propertycrm.com / admin123');

  // Create Agents
  const agentPassword = await bcrypt.hash('agent123', 10);
  
  const agent1 = await User.create({
    name: 'Ahmed Khan',
    email: 'ahmed@propertycrm.com',
    password: agentPassword,
    role: 'agent',
  });

  const agent2 = await User.create({
    name: 'Sara Ali',
    email: 'sara@propertycrm.com',
    password: agentPassword,
    role: 'agent',
  });

  const agent3 = await User.create({
    name: 'Usman Raza',
    email: 'usman@propertycrm.com',
    password: agentPassword,
    role: 'agent',
  });

  console.log('Created 3 Agents: agent@propertycrm.com / agent123');

  // Create Leads
  const leadsData = [
    { name: 'Bilal Sheikh', email: 'bilal@gmail.com', phone: '923001234567', propertyInterest: 'Gulshan-e-Iqbal Flat', budget: '25000000', status: 'new', score: 'high', notes: 'Interested in 3 bedroom', assignedTo: agent1._id },
    { name: 'Fatima Zahra', email: 'fatima@yahoo.com', phone: '923212345678', propertyInterest: 'PECHS House', budget: '18000000', status: 'contacted', score: 'medium', notes: 'Called twice, interested', assignedTo: agent1._id },
    { name: 'Imran Hussain', email: 'imran@outlook.com', phone: '923341234567', propertyInterest: 'Clifton Apartment', budget: '8000000', status: 'qualified', score: 'low', notes: 'First time buyer', assignedTo: agent1._id },
    { name: 'Aisha Malik', email: 'aisha@gmail.com', phone: '923451234567', propertyInterest: 'Defense Commercial', budget: '35000000', status: 'negotiation', score: 'high', notes: 'Serious buyer', assignedTo: agent1._id },
    { name: 'Mohammad Danish', email: 'danish@gmail.com', phone: '923561234567', propertyInterest: 'Gulshan-e-Johar Villa', budget: '45000000', status: 'new', score: 'high', notes: 'Looking for luxury', assignedTo: agent2._id },
    { name: 'Zainab Ahmed', email: 'zainab@yahoo.com', phone: '923671234567', propertyInterest: 'Scheme 33 Plot', budget: '15000000', status: 'contacted', score: 'medium', notes: 'Investor', assignedTo: agent2._id },
    { name: 'Ali Raza', email: 'ali@outlook.com', phone: '923781234567', propertyInterest: 'Lyari Flat', budget: '5000000', status: 'closed-won', score: 'low', notes: 'Deal closed!', assignedTo: agent2._id },
    { name: 'Nosheen Bano', email: 'nosheen@gmail.com', phone: '923891234567', propertyInterest: 'FB Area Shop', budget: '22000000', status: 'qualified', score: 'high', notes: 'Commercial inquiry', assignedTo: agent2._id },
    { name: 'Qasim Khan', email: 'qasim@gmail.com', phone: '923901234567', propertyInterest: 'North Nazimabad Flat', budget: '12000000', status: 'new', score: 'medium', notes: 'Family of 4', assignedTo: agent3._id },
    { name: 'Hira Sultan', email: 'hira@yahoo.com', phone: '9201012345678', propertyInterest: 'Cantt Area Commercial', budget: '55000000', status: 'negotiation', score: 'high', notes: 'Urgent requirement', assignedTo: agent3._id },
    { name: 'Tanveer Ahmed', email: 'tanveer@outlook.com', phone: '9201112345678', propertyInterest: 'Saddar Office', budget: '30000000', status: 'contacted', score: 'high', notes: 'Business purchase', assignedTo: agent3._id },
    { name: 'Saima Noor', email: 'saima@gmail.com', phone: '9201212345678', propertyInterest: 'Garden West Home', budget: '9000000', status: 'closed-lost', score: 'low', notes: 'Budget issue', assignedTo: agent3._id },
  ];

  const createdLeads = await Lead.insertMany(leadsData);
  console.log('Created 12 leads');

  // Create Activity logs
  for (const lead of createdLeads) {
    await Activity.create({
      leadId: lead._id,
      userId: lead.assignedTo,
      action: 'created',
      description: `Lead created - ${lead.score.toUpperCase()} priority`,
    });
  }
  console.log('Created activity logs');

  console.log('\n=== SEED COMPLETE ===\n');
  console.log('LOGIN CREDENTIALS:');
  console.log('----------------------');
  console.log('ADMIN:  admin@propertycrm.com / admin123');
  console.log('AGENT:  ahmed@propertycrm.com / agent123');
  console.log('AGENT:  sara@propertycrm.com / agent123');
  console.log('AGENT:  usman@propertycrm.com / agent123');
  console.log('----------------------');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});