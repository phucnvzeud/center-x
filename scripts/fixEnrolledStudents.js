/**
 * SOLUTION: Run this in your browser console while on the courses page
 * This will fix all courses by updating each one through the API
 * No database access required
 */

// Copy this entire code and paste it into your browser console

(async function fixAllCourses() {
  console.log("Starting course fix...");
  
  try {
    // Step 1: Get all courses
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error(`Failed to fetch courses: ${response.status}`);
    
    const courses = await response.json();
    console.log(`Found ${courses.length} courses to check`);
    
    // Step 2: Update each course one by one
    let updateCount = 0;
    
    for (const course of courses) {
      // Make a copy of the course and ensure totalStudent is a number
      const courseUpdate = { ...course };
      
      // Remove virtual fields that can't be updated
      delete courseUpdate.enrollmentCount;
      delete courseUpdate.progress;
      delete courseUpdate.estimatedEndDate;
      delete courseUpdate.id;
      
      // Set totalStudent to 0 if it's not already set
      if (courseUpdate.totalStudent === undefined || courseUpdate.totalStudent === null) {
        courseUpdate.totalStudent = 0;
        console.log(`Setting totalStudent=0 for course "${course.name}"`);
        
        // Send the update through API
        try {
          const updateUrl = `/api/courses/${course._id}`;
          const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseUpdate)
          });
          
          if (updateResponse.ok) {
            console.log(`✅ Successfully updated "${course.name}"`);
            updateCount++;
          } else {
            console.error(`❌ Failed to update "${course.name}": ${updateResponse.status}`);
          }
        } catch (error) {
          console.error(`❌ Error updating "${course.name}":`, error);
        }
      }
    }
    
    console.log(`✅ Fix completed! Updated ${updateCount} courses`);
    
    if (updateCount > 0) {
      console.log("🔄 Refreshing page to see changes...");
      setTimeout(() => window.location.reload(), 2000);
    }
  } catch (error) {
    console.error("Error in fix script:", error);
  }
})(); 