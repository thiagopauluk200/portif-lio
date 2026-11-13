import { getContent } from "@/lib/store";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Skills } from "@/components/site/Skills";
import { Projects } from "@/components/site/Projects";
import { Experience } from "@/components/site/Experience";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { MotionProvider } from "@/components/ui/MotionProvider";

// Página estática regenerada sob demanda: o admin chama revalidatePath("/") a cada alteração.
export const revalidate = 3600;

export default async function Home() {
  const { profile, skills, projects, experiences } = await getContent();
  const techs = Array.from(new Set(skills.filter((s) => !["soft", "idiomas"].includes(s.id)).flatMap((s) => s.items)));

  return (
    <MotionProvider>
      <Navbar name={profile.name} />
      <main>
        <Hero profile={profile} techs={techs} />
        <Skills skills={skills} />
        <Projects projects={projects} />
        <Experience experiences={experiences} />
        <Contact profile={profile} />
      </main>
      <Footer profile={profile} />
    </MotionProvider>
  );
}
