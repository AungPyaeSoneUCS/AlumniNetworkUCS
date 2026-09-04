// File: ChitSuWaiPortfolio.tsx
import React from 'react';
import { 
  Phone, 
  Code2, 
  Database, 
  Layout, 
  ExternalLink, 
  Globe, 
  GitBranch,
  GraduationCap
} from 'lucide-react';

const GithubIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

export default function ChitSuWaiPortfolio() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300">
      
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden flex flex-col items-center text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-gray-50 to-gray-50 dark:from-indigo-900/20 dark:via-slate-950 dark:to-slate-950"></div>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase mb-3">Web Developer</h2>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Chit Su Wai
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-6 font-medium">
            PHP | Web Development | MySQL
          </p>
          <p className="max-w-2xl mx-auto text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
            Passionate about building responsive, dynamic web applications. Experienced in crafting seamless user interfaces with HTML, CSS, JS, and robust backends using PHP and MySQL.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://github.com/Chit-Su-Wai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all w-full sm:w-auto justify-center"
            >
              <GithubIcon size={20} />
              View GitHub
            </a>
            <a 
              href="#contact" 
              className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all w-full sm:w-auto justify-center shadow-sm"
            >
              <Phone size={20} />
              Contact Me
            </a>
          </div>
        </div>
      </header>

      <section className="py-20 px-6 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Technical Arsenal</h2>
            <p className="text-slate-500 dark:text-slate-400">Specialized in core web technologies and database management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                <Layout size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-6">Frontend Development</h3>
              <div className="grid grid-cols-2 gap-4">
                {['HTML5', 'CSS3', 'JavaScript', 'Responsive Design'].map((skill) => (
                  <div key={skill} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Code2 size={18} className="text-indigo-500" />
                    <span className="font-medium">{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                <Database size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-6">Backend & Tools</h3>
              <div className="grid grid-cols-2 gap-4">
                {['PHP', 'MySQL', 'Git', 'GitHub'].map((skill) => (
                  <div key={skill} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Database size={18} className="text-emerald-500" />
                    <span className="font-medium">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Code & Projects</h2>
            <p className="text-slate-500 dark:text-slate-400">Bringing ideas to life through robust code and version control.</p>
          </div>

          <a 
            href="https://alumni.ucsh.edu.mm/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block mb-8 p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                <GraduationCap size={32} />
              </div>
              <ExternalLink size={20} className="text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">UCSH Alumni Network</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-3xl">
              The official alumni networking platform for the University of Computer Studies, Hinthada. 
              Collaborated to build robust web interfaces and secure, scalable database architectures utilizing HTML, CSS, JS, PHP, and MySQL.
            </p>
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Globe size={16} />
              alumni.ucsh.edu.mm
            </span>
          </a>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <a 
              href="https://github.com/Chit-Su-Wai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center">
                  <GithubIcon size={32} />
                </div>
                <ExternalLink size={20} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">GitHub Portfolio</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Explore my repositories, commits, and web development projects showcasing my skills in PHP, MySQL, HTML, CSS, and JS.
              </p>
              <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                github.com/Chit-Su-Wai
              </span>
            </a>

            <div className="group block p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:-translate-y-1 shadow-sm hover:shadow-md">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                  <Globe size={32} />
                </div>
                <GitBranch size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3">Web Applications</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Building functional, database-driven websites and dynamic single-page applications focused on clean code and great user experiences.
              </p>
              <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 size={16} className="text-indigo-500" />
                Full Stack Development
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="py-16 px-6 bg-slate-900 dark:bg-slate-950 text-slate-400">
        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <h2 className="text-2xl font-bold text-white mb-8">Let's Connect</h2>
          
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <a href="tel:09699855353" className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors">
              <Phone size={18} className="text-indigo-400" />
              <span>09 699 855 353</span>
            </a>
          </div>

          <div className="flex gap-6 mb-8 border-t border-slate-800 pt-8 w-full justify-center">
            <a href="https://github.com/Chit-Su-Wai/" target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors" aria-label="GitHub">
              <GithubIcon size={24} />
            </a>
          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Chit Su Wai. Built with Next.js & Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}