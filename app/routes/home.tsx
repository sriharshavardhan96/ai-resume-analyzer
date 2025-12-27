import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import { resumes } from "../../constants/index";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resumind - Tailor Your Resume" },
    { name: "description", content: "Tailor your resume with AI" },
  ];
}

export default function Home() {


  const {auth } = usePuterStore();
  const navigate = useNavigate();

  useEffect(() => {
    if(!auth.isAuthenticated){
      navigate('auth?next=/');
    }
  }, [auth.isAuthenticated]);

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Resumind</h1>
         <h2>Tailor your resume with AI & Review your submission and check AI-powered feedback</h2>
      </div>
      {resumes?.length > 0 && (
      <div className="resumes-section">
        {resumes.map((resume: Resume) => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>
      )}
    </section>
  </main>;
}
