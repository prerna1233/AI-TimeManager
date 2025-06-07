// document.getElementById("plan-form").addEventListener("submit", async function (e) {
//     e.preventDefault();
//     generatePlan();
//   });


//   async function generatePlan() {
//     const subjectsInput = document.getElementById("subjects").value.trim();
//     const deadlinesInput = document.getElementById("deadlines").value.trim();
//     const freeHours = parseInt(document.getElementById("freeHours").value.trim());
//     const extraNotes = document.getElementById("extraNotes").value.trim();
//     const output = document.getElementById("plan-output");

//     try {
//       const subjects = subjectsInput.split(",").map(s => s.trim());
//       const deadlines = JSON.parse(deadlinesInput);

//       if (subjects.length === 0 || isNaN(freeHours)) {
//         output.textContent = "Please fill out all required fields properly.";
//         return;
//       }

//       let plan = ` Your Study Plan\n\nTotal Free Hours per Day: ${freeHours} hrs\n\n`;

//       subjects.forEach(subject => {
//         const deadline = deadlines[subject] || "No deadline";
//         const hoursPerSubject = (freeHours / subjects.length).toFixed(2);
//         plan += ` ${subject}\n  ➤ Deadline: ${deadline}\n  ➤ Suggested Time: ${hoursPerSubject} hrs/day\n\n`;
//       });

//       if (extraNotes) {
//         plan += ` Notes:\n${extraNotes}`;
//       }

//       output.textContent = plan;

//     } catch (error) {
//       output.textContent = " Error: Please enter valid JSON for deadlines.\nExample: { \"Math\": \"2025-06-10\", \"Science\": \"2025-06-12\" }";
//     }
//   }







  document.getElementById("plan-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    await generatePlanFromGemini();
  });

  async function generatePlanFromGemini() {
    const subjectsInput = document.getElementById("subjects").value.trim();
    const deadlinesInput = document.getElementById("deadlines").value.trim();
    const freeHours = parseInt(document.getElementById("freeHours").value.trim());
    const extraNotes = document.getElementById("extraNotes").value.trim();
    const output = document.getElementById("plan-output");

    try {
      const subjects = subjectsInput.split(",").map(s => s.trim());
      const deadlines = JSON.parse(deadlinesInput);

      if (subjects.length === 0 || isNaN(freeHours)) {
        output.textContent = "Please fill out all required fields properly.";
        return;
      }

      const response = await fetch("http://localhost:5000/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjects,
          deadlines,
          freeHours,
          extraNotes
        }),
      });

      const data = await response.json();
      if (data.plan) {
        output.textContent = data.plan;
      } else {
        output.textContent = "Something went wrong. Please try again.";
      }

    } catch (error) {
      output.textContent = "❌ Error: Please enter valid JSON for deadlines.\nExample: { \"Math\": \"2025-06-10\", \"Science\": \"2025-06-12\" }";
      console.error(error);
    }
  }
