/**
 * Direct database update script to add the enrolledStudents field to all courses
 * This will run a MongoDB update command directly
 * 
 * Run using: 
 * mongo yourdatabase --eval "load('scripts/fixEnrolledStudents.js')"
 */

// Direct MongoDB update to set enrolledStudents for all courses where it doesn't exist
db.courses.updateMany(
  { enrolledStudents: { $exists: false } },
  [{ 
    $set: { 
      enrolledStudents: { 
        $cond: {
          if: { $isArray: "$enrollments" },
          then: { $size: "$enrollments" },
          else: 0
        }
      } 
    } 
  }]
);

// Update all courses to ensure enrolledStudents is a number
db.courses.updateMany(
  {}, 
  [{ 
    $set: { 
      enrolledStudents: { 
        $convert: {
          input: "$enrolledStudents",
          to: "int",
          onError: 0,
          onNull: 0
        }
      } 
    } 
  }]
);

// Print the result
var result = db.courses.find({}, { name: 1, enrolledStudents: 1 }).toArray();
print("Updated courses with enrolledStudents field:");
result.forEach(function(course) {
  print(course.name + ": " + course.enrolledStudents);
}); 