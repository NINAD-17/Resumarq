import ReactMarkdown from "react-markdown";
import type { AnalysisResponse } from "@/types/analysis";

export function CompanyResearchSection({ data }: { data: NonNullable<AnalysisResponse["results"]>["companyResearch"] }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-[18px] font-semibold mb-2">{data.company_profile.company_name}</h2>
        {data.company_profile.domain && (
          <p className="text-sm text-muted-foreground mb-4">Domain: {data.company_profile.domain}</p>
        )}
        <div className="text-muted-foreground leading-relaxed text-[14px]">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3">{children}</p>,
            }}
          >
            {data.company_profile.about}
          </ReactMarkdown>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="text-muted-foreground leading-relaxed text-[14px]">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-4 text-foreground">{children}</h1>,
              h2: ({ children }) => <h2 className="text-[17px] font-bold mb-3 mt-4 text-foreground">{children}</h2>,
              h3: ({ children }) => <h3 className="text-[15px] font-semibold mb-3 mt-4 text-foreground">{children}</h3>,
              h4: ({ children }) => <h4 className="text-[14px] font-semibold mb-2 mt-3 text-foreground">{children}</h4>,
              p: ({ children }) => <p className="mb-4 text-[14px] leading-relaxed text-muted-foreground">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[14px] text-muted-foreground">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-[14px] text-muted-foreground">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            }}
          >
            {data.personalized_guide}
          </ReactMarkdown>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.company_profile.ceo && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold mb-1">CEO</h4>
            <p className="text-sm text-muted-foreground">{data.company_profile.ceo}</p>
          </div>
        )}
        {data.company_profile.founders && data.company_profile.founders.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold mb-1">Founders</h4>
            <p className="text-sm text-muted-foreground">{data.company_profile.founders.join(", ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
