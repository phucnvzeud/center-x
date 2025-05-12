const mongoose = require('mongoose');

// Define Branch model
const branchSchema = new mongoose.Schema({
  name: String,
  address: String,
  active: { type: Boolean, default: true }
});
const Branch = mongoose.model('Branch', branchSchema);

// Original Course model (with string branch)
const oldCourseSchema = new mongoose.Schema({
  name: String,
  branch: String,
  teacher: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  // Other fields not needed for migration
});
const OldCourse = mongoose.model('OldCourse', oldCourseSchema, 'courses');

// New Course model (with objectId branch)
const newCourseSchema = new mongoose.Schema({
  name: String,
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  teacher: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  // Other fields not needed for migration
});
const NewCourse = mongoose.model('NewCourse', newCourseSchema, 'courses');

async function migrateBranches() {
  try {
    // Connect to MongoDB - use a simplified URI
    const MONGO_URI = 'mongodb+srv://dedzeud:Samurai1606@dedfinance.us8qhwr.mongodb.net/language-center';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all branches
    const branches = await Branch.find();
    console.log(`Found ${branches.length} branches`);

    // Get courses with string branches
    const courses = await OldCourse.find({ 
      branch: { $type: 'string' }
    });
    console.log(`Found ${courses.length} courses with string branch names`);

    // Process each course
    let updated = 0;
    for (const course of courses) {
      try {
        const branchName = course.branch;
        
        // Find matching branch
        let branch = branches.find(b => b.name === branchName);
        
        // Create branch if not exists
        if (!branch) {
          console.log(`Creating new branch: ${branchName}`);
          const newBranch = new Branch({
            name: branchName || 'Unknown Branch',
            address: ''
          });
          branch = await newBranch.save();
          branches.push(branch);
        }
        
        // Update course
        await NewCourse.updateOne(
          { _id: course._id },
          { $set: { branch: branch._id } }
        );
        
        console.log(`Updated course ${course._id}: ${course.name} to use branch ${branch._id}`);
        updated++;
      } catch (error) {
        console.error(`Error updating course ${course._id}:`, error.message);
      }
    }

    console.log(`Migration complete. Updated ${updated} of ${courses.length} courses.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateBranches(); 