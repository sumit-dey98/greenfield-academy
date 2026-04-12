import Link from "next/link"
import { MapPin, Phone, Mail, ArrowRight } from "lucide-react"

const contact = [
  {
    icon: <MapPin size={20} />,
    label: "Address",
    value: "123 Education Lane, Dhaka, Bangladesh",
    color: "#059669",
  },
  {
    icon: <Phone size={20} />,
    label: "Phone",
    value: "+880-2-9876543",
    color: "#0891b2",
  },
  {
    icon: <Mail size={20} />,
    label: "Email",
    value: "info@greenfieldacademy.edu.bd",
    color: "#9333ea",
  },
]

export default function ContactCTA() {
  return (
    <section className="bg-surface border-t border-surface-2 py-10 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Text */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
                Get In Touch
              </div>
              <h2 className="text-3xl font-bold text-text mb-3">
                We'd love to hear from you
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Whether you have a question about admissions, want to visit the campus, or just want to learn more about Greenfield Academy — our team is always happy to help.
              </p>
            </div>

            {/* Contact details */}
            <div className="flex flex-col gap-4">
              {contact.map((c, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${c.color}18`, color: c.color, boxShadow: `0 0 1px 1px ${c.color}30` }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-muted">{c.label}</div>
                    <div className="text-sm text-text">{c.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 flex-wrap">
              <Link href="/admission" className="btn btn-primary h-10">
                Apply for Admission
                <ArrowRight size={15} />
              </Link>
              <Link href="/about" className="btn btn-outline">
                Learn More
              </Link>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-xl overflow-hidden border border-border shadow-card h-80">
            <iframe
              title="Greenfield Academy Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.902!2d90.3742!3d23.7461!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ0JzQ2LjAiTiA5MMKwMjInMjcuMSJF!5e0!3m2!1sen!2sbd!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

        </div>
      </div>
    </section>
  )
}