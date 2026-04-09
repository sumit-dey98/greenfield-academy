export async function POST(request) {
  try {
    const body = await request.json()

    const required = [
      "studentName",
      "dob",
      "gender",
      "applyingClass",
      "guardianName",
      "guardianPhone",
      "guardianEmail",
      "address",
    ]

    const missing = required.filter(field => !body[field]?.toString().trim())

    if (missing.length > 0) {
      return Response.json(
        {
          success: false,
          error: `Please fill in all required fields: ${missing.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.guardianEmail)) {
      return Response.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    // Phone format check — basic
    const phoneRegex = /^[+\d\s\-()]{7,20}$/
    if (!phoneRegex.test(body.guardianPhone)) {
      return Response.json(
        { success: false, error: "Please enter a valid phone number." },
        { status: 400 }
      )
    }

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 800))

    return Response.json(
      {
        success: true,
        message: "Your application has been received successfully. We will contact you within 3-5 working days.",
        reference: `GFA-${Date.now().toString().slice(-6)}`,
      },
      { status: 200 }
    )

  } catch {
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}