import React from 'react';
import { motion } from 'framer-motion';
import TeamMemberCard from './TeamMemberCard';

export default function AboutTeam() {
  const team = [
    {
      name: "Hritik Raj",
      role: "CEO & Co-Founder",
      imageSrc: "/people_images/Hritik Raj.jpeg",
      linkedin: "https://www.linkedin.com/in/hritikshukla005"
    },
    {
      name: "Sachin Rana",
      role: "Lead Systems Architect",
      imageSrc: "/people_images/Sachin Rana.jpg",
      linkedin: "https://www.linkedin.com/in/sachin-rana077"
    },
    {
      name: "Mannat Kumar",
      role: "Principal Data & AI Infrastructure Engineer",
      imageSrc: "/people_images/Mannat Kumar.jpeg",
      linkedin: "https://www.linkedin.com/in/mannat-kumar-91407837a?utm_source=share_via&utm_content=profile&utm_medium=member_android"
    },
    {
      name: "Utsav Raj",
      role: "Senior Full-Stack Interaction Developer",
      imageSrc: "/people_images/Utsav Raj.jpeg",
      linkedin: "https://www.linkedin.com/in/utsav-raj04"
    }
  ];

  return (
    <section className="py-24 bg-[#fcfcfc] border-b border-border">
      <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row gap-16">
        <div className="md:w-1/3">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-display font-medium text-text-primary mb-6"
          >
            Our team
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-text-tertiary leading-relaxed text-[15px]"
          >
            The engineering cell behind your infrastructure. A dense team of systems architects, data specialists, and interaction developers focused entirely on scaling your operational leverage.
          </motion.p>
        </div>

        <div className="md:w-2/3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border p-px">
            {team.map((member, idx) => (
              <TeamMemberCard key={idx} {...member} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
