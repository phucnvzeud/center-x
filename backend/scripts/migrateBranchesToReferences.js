const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

// Parse the .env file manually
const env = {};
envLines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    env[key.trim()] = value.trim();
  }
});

// Define models here to avoid dependency issues
const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Branch name is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const sessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Taught', 'Absent (Personal Reason)', 'Absent (Holiday)', 'Absent (Other Reason)'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Branch is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Teacher is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },
  weeklySchedule: [scheduleSchema],
  totalSessions: {
    type: Number,
    required: [true, 'Total number of sessions is required'],
    min: 1
  },
  sessions: [sessionSchema],
  description: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Proficient'],
    required: true
  },
  maxStudents: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['Active', 'Upcoming', 'Finished', 'Cancelled'],
    default: 'Upcoming'
  },
  price: {
    type: Number,
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Define models
const Branch = mongoose.model('Branch', branchSchema);
const Course = mongoose.model('Course', courseSchema);

const migrateBranchesToReferences = async () => {
  try {
    // Get the MongoDB URI from the environment variables
    const MONGO_URI = env.MONGO_URI;
    
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    
    console.log('Connecting to MongoDB...');
    console.log(`URI: ${MONGO_URI.substring(0, 20)}...`);
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all courses - we need to handle courses that have branch as string
    const courses = await Course.find({
      branch: { $type: "string" }
    });
    console.log(`Found ${courses.length} courses with string branch names to migrate`);

    // Get all branches
    const branches = await Branch.find();
    console.log(`Found ${branches.length} branches for reference`);

    let successCount = 0;
    let errorCount = 0;

    // Process each course
    for (const course of courses) {
      try {
        const branchName = course.branch;
        
        // Skip if already an ObjectId
        if (mongoose.Types.ObjectId.isValid(course.branch)) {
          console.log(`Course ${course._id} already has an ObjectId branch reference`);
          successCount++;
          continue;
        }

        // Find matching branch by name
        const matchingBranch = branches.find(b => b.name === branchName);
        
        if (matchingBranch) {
          // Update course with branch reference
          course.branch = matchingBranch._id;
          await course.save();
          console.log(`Updated course ${course._id} with branch ${matchingBranch.name} (${matchingBranch._id})`);
          successCount++;
        } else {
          // Create a new branch if one doesn't exist
          const newBranch = new Branch({
            name: branchName || 'Unknown Branch',
            address: ''
          });
          
          const savedBranch = await newBranch.save();
          course.branch = savedBranch._id;
          await course.save();
          
          console.log(`Created new branch "${branchName}" and updated course ${course._id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing course ${course._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('Migration complete');
    console.log(`Successfully migrated: ${successCount} courses`);
    console.log(`Errors: ${errorCount} courses`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run the migration
migrateBranchesToReferences(); 