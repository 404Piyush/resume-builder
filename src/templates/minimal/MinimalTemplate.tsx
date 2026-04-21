import { HTMLRenderer } from '@/helpers/common/components/HTMLRenderer';
import { SectionValidator } from '@/helpers/common/components/ValidSectionRenderer';
import { StateContext } from '@/modules/builder/resume/ResumeLayout';
import { useContext } from 'react';

type SkillItem = { name: string };
type WorkItem = {
  id: string;
  position: string;
  startDate: string | null;
  isWorkingHere: boolean;
  endDate: string | null;
  name: string;
  summary: string;
};
type EducationItem = {
  id: string;
  institution: string;
  studyType: string;
  area: string;
  startDate: string | null;
  endDate: string | null;
};

const MinimalTemplate = () => {
  const resumeData = useContext(StateContext);

  return (
    <div className="h-full bg-white text-zinc-800 p-6 text-[11px]">
      <div className="grid grid-cols-[34%,66%] h-full gap-4">
        <aside className="border-r border-zinc-200 pr-4">
          <h1 className="text-[22px] font-bold leading-tight">{resumeData.basics.name}</h1>
          <p className="text-[12px] text-zinc-500 mb-3">{resumeData.basics.label}</p>

          <div className="space-y-1 text-[10px] text-zinc-600 mb-4">
            <p>{resumeData.basics.email}</p>
            <p>{resumeData.basics.phone}</p>
            <p>{resumeData.basics.location.city}</p>
          </div>

          <SectionValidator value={resumeData.skills.languages}>
            <h3 className="text-[12px] font-semibold uppercase tracking-wide mb-2">Skills</h3>
            <div className="space-y-2">
              {[
                ...resumeData.skills.languages,
                ...resumeData.skills.frameworks,
                ...resumeData.skills.technologies,
                ...resumeData.skills.libraries,
                ...resumeData.skills.databases,
                ...resumeData.skills.tools,
              ].map((item: SkillItem, index: number) => (
                <p
                  key={`${item.name}-${index}`}
                  className="text-[10px] border-b border-zinc-100 pb-1"
                >
                  {item.name}
                </p>
              ))}
            </div>
          </SectionValidator>
        </aside>

        <main>
          <SectionValidator value={resumeData.basics.summary}>
            <section className="mb-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide mb-1">Summary</h3>
              <HTMLRenderer htmlString={resumeData.basics.summary} />
            </section>
          </SectionValidator>

          <SectionValidator value={resumeData.work}>
            <section className="mb-4">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide mb-1">Experience</h3>
              <div className="space-y-3">
                {(resumeData.work as WorkItem[]).map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-center">
                      <h4 className="text-[12px] font-semibold">{item.position}</h4>
                      <span className="text-[10px] text-zinc-500">
                        {item.startDate} - {item.isWorkingHere ? 'Present' : item.endDate}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-600">{item.name}</p>
                    <HTMLRenderer htmlString={item.summary} />
                  </div>
                ))}
              </div>
            </section>
          </SectionValidator>

          <SectionValidator value={resumeData.education}>
            <section>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide mb-1">Education</h3>
              {(resumeData.education as EducationItem[]).map((item) => (
                <div key={item.id} className="mb-2">
                  <p className="font-semibold text-[11px]">{item.institution}</p>
                  <p className="text-[10px] text-zinc-600">
                    {item.studyType}, {item.area} | {item.startDate} - {item.endDate}
                  </p>
                </div>
              ))}
            </section>
          </SectionValidator>
        </main>
      </div>
    </div>
  );
};

export default MinimalTemplate;
