const fs = require('fs');

const data = [
    "Roof of Building Inspection - Bi-Annual\n6 tasks",
    "Roofing Elements of Building Inspection - Bi-Annual\n6 tasks",
    "Mechanical Systems of Building Inspection\n4 tasks",
    "Interior of Building Inspection\n18 tasks",
    "Ground of Building Inspection\n6 tasks",
    "Exterior Wall Material of Building Inspection - Bi-Annual\n3 tasks",
    "Exterior Finishes of Building Inspection\n2 tasks",
    "Exterior Ceilings and Decks of Building Inspection - Bi-Annual\n3 tasks",
    "Electrical Systems of Building Inspection\n6 tasks",
    "Building and Facilities Inspection for Cosmetics Manufacturing\n5 tasks",
    "Attic of Building Inspection\n8 tasks",
    "Air Handling System Inspection - Annually\n2 tasks",
    "Air Handling System Inspection - Monthly\n3 tasks",
    "Reopening Facility Maintenance, Employment (Covid-19 Best Practices)\n14 tasks",
    "Reopening Facility Maintenance, Health Policy (Covid-19 Best Practices)\n20 tasks",
    "Reopening Facility Maintenance, Logistics (Covid-19 Best Practices)\n10 tasks",
    "Reopening Facility Maintenance and Faith-Based Organizations (Covid-19 Best Practices)\n13 tasks",
    "Cleaning for Facility Maintenance, All Areas (Covid-19)\n3 tasks",
    "Cleaning for Facility Maintenance, Athletics Facilities (Covid-19)\n4 tasks",
    "Cleaning for Facility Maintenance, Bathrooms (Covid-19)\n9 tasks",
    "Cleaning for Facility Maintenance, Cafeteria (Covid-19)\n10 tasks",
    "Cleaning for Facility Maintenance, Classrooms & Offices (Covid-19)\n14 tasks",
    "Cleaning for Facility Maintenance, Gyms & Auditoriums (Covid-19)\n4 tasks",
    "Cleaning for Facility Maintenance, Hallways (Covid-19)\n5 tasks",
    "Cleaning for Facility Maintenance, Outdoor Areas (Covid-19)\n6 tasks",
    "Reopening Child Care Facilities (Covid-19 Best Practices)\n13 tasks",
    "Reopening Child Care Facilities - Steps to Take When You Have a Suspected or Confirmed Case in Your Facility (Covid-19 Best Practices)\n8 tasks",
    "Reopening K-12 Facility Maintenance: Administrative Practices (Covid-19 Best Practices)\n10 tasks",
    "Reopening K-12 Facility Maintenance: Cafeteria Guidelines (Covid-19 Best Practices)\n5 tasks",
    "Reopening K-12 Facility Maintenance: Clean, Sanitize, & Ventilate (Covid-19 Best Practices)\n6 tasks",
    "Reopening K-12 Facility Maintenance: Limit Sharing (Covid-19 Best Practices)\n3 tasks",
    "Reopening K-12 Facility Maintenance: Maintain Health & Hygiene (Covid-19 Best Practices)\n6 tasks",
    "Reopening K-12 Facility Maintenance: Manage Student & Staff Health (Covid-19 Best Practices)\n7 tasks",
    "Reopening Colleges and Universities (Covid-19 Best Practices)\n11 tasks",
    "Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for K-12 Facility Maintenance\n8 tasks",
    "Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Fitness Centers and Gyms\n7 tasks",
    "Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Facility Maintenance\n7 tasks",
    "Reopening Small Businesses: Step 1 - Educate Yourself (Covid-19 Best Practices)\n3 tasks",
    "Reopening Small Businesses: Step 2 - Assess Your Finances (Covid-19 Best Practices)\n6 tasks",
    "Reopening Small Businesses: Step 3 - Adjust Business Model (Covid-19 Best Practices)\n4 tasks",
    "Reopening Small Businesses: Step 4 - Plan Your Staffing (Covid-19 Best Practices)\n7 tasks",
    "Reopening Small Businesses: Step 5 - Keep Your Workplace Clean (Covid-19 Best Practices)\n5 tasks",
    "Reopening Small Businesses: Step 6 - Implement Social Distancing (Covid-19 Best Practices)\n8 tasks",
    "Reopening Small Businesses: Step 7 - Set Up Health Screening (Covid-19 Best Practices)\n3 tasks",
    "Reopening Small Businesses: Step 8 - Market Your Business (Covid-19 Best Practices)\n4 tasks",
    "Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Child Care Facilities\n7 tasks",
    "Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Colleges and Universities\n9 tasks",
    "Reported Covid-19 Case - Emergency Cleaning & Disinfecting Measures for Homeless Shelters\n9 tasks",
    "Cleaning Checklist for Homeless Shelters\n13 tasks",
    "Cleaning & Disinfecting Protocols for Casinos (COVID-19)\n14 tasks",
    "Reopening Casinos - Workplace Specific Plan (COVID-19 Best Practices)\n8 tasks",
    "Reopening Casinos - Topics for Worker Training (COVID-19 Best Practices)\n10 tasks",
    "Reopening Casinos - Individual Control Measures (COVID-19 Best Practices)\n7 tasks",
    "Reopening Casinos - Cleaning & Disinfecting (COVID-19 Best Practices)\n17 tasks",
    "Reopening Casinos - Physical Distancing Guidelines (COVID-19 Best Practices)\n11 tasks",
    "Reopening Casinos - Additional Guidelines for Interacting with the Public (COVID-19 Best Practices)\n9 tasks",
    "Reopening Family Entertainment Centers - Workplace Specific Plan (COVID-19 Best Practices)\n7 tasks",
    "Reopening Family Entertainment Centers - Topics for Worker Training (COVID-19 Best Practices)\n10 tasks",
    "Reopening Family Entertainment Centers - Individual Control Measures (COVID-19 Best Practices)\n8 tasks",
    "Reopening Family Entertainment Centers - Physical Distancing Guidelines (COVID-19 Best Practices)\n20 tasks",
    "Reopening Family Entertainment Centers - Additional Guidelines for Indoor Movie Theaters (COVID-19 Best Practices)\n9 tasks",
    "Reopening Amusement Parks: Maintaining Healthy Environments (COVID-19 Best Practices)\n24 tasks",
    "Reopening Amusement Parks: Promoting Behaviors that Reduce Spread (COVID-19 Best Practices)\n16 tasks",
    "Cleaning & Disinfecting Protocols for Retail Stores (COVID-19)\n13 tasks",
    "Cleaning & Disinfecting Protocols for Places of Worship (COVID-19)\n15 tasks",
    "Places of Worship - Workplace Specific Plan (COVID-19 Best Practices)\n7 tasks",
    "Places of Worship - Topics for Worker Training (COVID-19 Best Practices)\n10 tasks",
    "Places of Worship - Individual Control Measures (COVID-19 Best Practices)\n8 tasks",
    "Places of Worship - Cleaning & Disinfecting (COVID-19 Best Practices)\n19 tasks",
    "Places of Worship - Other Considerations (COVID-19 Best Practices)\n7 tasks",
    "Reopening Fitness Centers and Gyms - Cleaning & Disinfecting (COVID-19 Best Practices)\n25 tasks",
    "Reopening Fitness Centers and Gyms - Individual Control Measures (COVID-19 Best Practices)\n10 tasks",
    "Reopening Fitness Centers and Gyms - Physical Distancing Guidelines (COVID-19 Best Practices)\n19 tasks",
    "Reopening Fitness Centers and Gyms - Restrooms & Shower Facilities (COVID-19 Best Practices)\n10 tasks",
    "Reopening Fitness Centers and Gyms - Swimming Pools & Aquatic Venues (COVID-19 Best Practices)\n17 tasks",
    "Reopening Fitness Centers and Gyms - Topics for Worker Training (COVID-19 Best Practices)\n11 tasks",
    "Reopening Fitness Centers and Gyms - Workplace Specific Plan (COVID-19 Best Practices)\n9 tasks"
];

const uniqueData = [...new Set(data)];

let newTemplates = [];
let idx = 1;
for (const item of uniqueData) {
    if (!item.includes('tasks')) continue;
    const parts = item.split('\n');
    if (parts.length < 2) continue;
    
    const title = parts[0].trim();
    const taskCount = parseInt(parts[1].replace('tasks', '').trim()) || 5;
    
    let industry = 'Facility Maintenance';
    if (title.toLowerCase().includes('casino') || title.toLowerCase().includes('entertainment') || title.toLowerCase().includes('amusement')) industry = 'Property Management';
    if (title.toLowerCase().includes('retail') || title.toLowerCase().includes('worship')) industry = 'Property Management';
    if (title.toLowerCase().includes('fitness') || title.toLowerCase().includes('gym')) industry = 'Property Management';
    if (title.toLowerCase().includes('child care') || title.toLowerCase().includes('k-12') || title.toLowerCase().includes('school')) industry = 'Facility Maintenance';
    
    let tasks = [];
    for(let i=0; i<taskCount; i++) {
        tasks.push({ task: `Task ${i+1} for ${title}`, dataType: 'CHECKBOX', isRequired: true });
    }
    
    newTemplates.push(`    {
        id: 'tmpl_extracted_${idx++}',
        title: '${title.replace(/'/g, "\\'")}',
        industry: '${industry}',
        description: 'Standard checklist for ${title.replace(/'/g, "\\'")}',
        tasks: ${JSON.stringify(tasks, null, 12).replace(/"([^"]+)":/g, '$1:')}
    }`);
}

const file = 'c:/cmms-juric/cmms-app/frontend/src/pages/Checklists/components/TemplateLibrary.tsx';
let content = fs.readFileSync(file, 'utf8');
const searchString = "const TEMPLATES = [";
const replacement = `const TEMPLATES = [\n${newTemplates.join(',\n')},`;
content = content.replace(searchString, replacement);
fs.writeFileSync(file, content);
console.log('Injected templates!');
