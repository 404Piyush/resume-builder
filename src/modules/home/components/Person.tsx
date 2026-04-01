const persons = [
  {
    name: 'Piyush Utkar',
    role: 'Cloud Computing Student • Roll 654',
  },
  {
    name: 'Nandini Singh',
    role: 'Cloud Computing Student • Roll 643',
  },
  {
    name: 'Daksh Soni',
    role: 'Cloud Computing Student • Roll 645',
  },
];

const PersonCard = ({ children }: { children: React.ReactNode }) => (
  <div className="transition ease-in-out delay-100 duration-300 px-6 py-8 flex flex-col items-center text-center shadow hover:shadow-xl rounded-xl border-2 border-resume-50 hover:border-resume-100">
    {children}
  </div>
);

export default function Person() {
  return (
    <>
      {persons.map((person) => (
        <PersonCard key={person.name}>
          <p className="text-resume-800 font-bold">{person.name}</p>
          <p className="text-resume-400">{person.role}</p>
        </PersonCard>
      ))}
    </>
  );
}
