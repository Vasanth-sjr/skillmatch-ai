import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { Github, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[--ag-bg] border-t border-[--ag-border] py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <SkillMatchLogo size="sm" />
            <p className="text-sm text-[--ag-muted] mt-3">
              AI-powered skill matching for the modern workforce.
            </p>
            <div className="flex gap-3 mt-4">
              {[Github, Linkedin, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="p-2 rounded-none bg-[--ag-surface] border border-[--ag-border] text-[--ag-muted] hover:bg-[--ag-accent-dim] hover:text-[--ag-accent] hover:border-[--ag-accent]/50 transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: "PRODUCT", links: ["Features", "Pricing", "Integrations", "Changelog"] },
            { title: "COMPANY", links: ["About", "Careers", "Blog", "Press"] },
            { title: "SUPPORT", links: ["Help Center", "Documentation", "API Reference", "Contact"] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[--ag-text] mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-[--ag-muted] hover:text-[--ag-accent] transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[--ag-border] mt-8 pt-8 text-center">
          <p className="text-xs text-[--ag-muted]">
            © {new Date().getFullYear()} SkillMatch AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
