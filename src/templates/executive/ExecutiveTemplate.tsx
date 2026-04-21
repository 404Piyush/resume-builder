import { HTMLRenderer } from '@/helpers/common/components/HTMLRenderer';
import { SectionValidator } from '@/helpers/common/components/ValidSectionRenderer';
import { StateContext } from '@/modules/builder/resume/ResumeLayout';
import { useContext } from 'react';

type WorkItem = {
  id: string;
  position: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isWorkingHere: boolean;
  summary: string;
};

type EducationItem = {
  id: string;
  institution: string;
  area: string;
  studyType: string;
  startDate: string | null;
  endDate: string | null;
};

type SkillItem = {
  name: string;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-4">
    <h3 className="text-[13px] font-semibold tracking-[0.12em] text-slate-700 border-b border-slate-200 pb-1 mb-2 uppercase">
      {title}
    </h3>
    {children}
  </section>
);

const ExecutiveTemplate = () => {
  const resumeData = useContext(StateContext);

  return (
    <div className="h-full bg-white text-slate-800 px-7 py-6 text-[11px] leading-relaxed">
      <header className="border-b-2 border-slate-800 pb-3 mb-4">
        <h1 className="text-[28px] font-bold leading-tight">{resumeData.basics.name}</h1>
        <p className="text-[13px] text-slate-600 mt-1">{resumeData.basics.label}</p>
        <p className="text-[11px] text-slate-600 mt-1">
          {resumeData.basics.email} | {resumeData.basics.phone} | {resumeData.basics.location.city}
        </p>
      </header>

      <SectionValidator value={resumeData.basics.summary}>
        <Section title="Professional Summary">
          <HTMLRenderer htmlString={resumeData.basics.summary} />
        </Section>
      </SectionValidator>

      <SectionValidator value={resumeData.work}>
        <Section title="Experience">
          <div className="space-y-3">
            {(resumeData.work as WorkItem[]).map((item) => (
              <div key={item.id}>
                <div className="flex justify-between">
                  <h4 className="font-semibold text-[12px]">{item.position}</h4>
                  <span className="text-[10px] text-slate-500">
                    {item.startDate} - {item.isWorkingHere ? 'Present' : item.endDate}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-1">{item.name}</p>
                <HTMLRenderer htmlString={item.summary} />
              </div>
            ))}
          </div>
        </Section>
      </SectionValidator>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <SectionValidator value={resumeData.education}>
          <Section title="Education">
            <div className="space-y-2">
              {(resumeData.education as EducationItem[]).map((item) => (
                <div key={item.id}>
                  <p className="font-semibold">{item.studyType}</p>
                  <p className="text-slate-600">
                    {item.institution}, {item.area}
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    {item.startDate} - {item.endDate}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </SectionValidator>

        <SectionValidator value={resumeData.skills.languages}>
          <Section title="Core Skills">
            <div className="flex flex-wrap gap-1.5">
              {[
                ...resumeData.skills.languages,
                ...resumeData.skills.frameworks,
                ...resumeData.skills.technologies,
                ...resumeData.skills.libraries,
                ...resumeData.skills.databases,
              ].map((item: SkillItem, index: number) => (
                <span
                  key={`${item.name}-${index}`}
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px]"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </Section>
        </SectionValidator>
      </div>
    </div>
  );
};

export default ExecutiveTemplate;
