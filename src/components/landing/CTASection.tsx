import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 bg-[--ag-surface] border-t border-[--ag-border] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-[--ag-accent-dim] to-transparent opacity-50" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="bg-[--ag-accent] h-1 w-24 mx-auto mb-8 rounded-none" />
        <h2 className="text-4xl md:text-6xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight mb-6">
          Ready to Transform Your{" "}
          <br className="hidden md:block" />
          Hiring Process?
        </h2>
        <p className="text-lg text-[--ag-muted] max-w-2xl mx-auto mb-10">
          Join thousands of companies and candidates using AI-powered skill matching
          to find the perfect fit.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register">
            <Button size="xl" className="bg-[--ag-accent] text-[#07080F] font-bold hover:brightness-110 gap-2 shadow-[0_4px_20px_-5px_rgba(0,216,255,0.4)] rounded-none tracking-widest uppercase">
              Analyze my profile <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Button size="xl" variant="heroOutline" className="border-[--ag-accent] text-[--ag-accent] hover:bg-[--ag-accent-dim] rounded-none">
            Schedule Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
