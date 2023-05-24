const spreadsheetId = '1kAQ344FGDrWCJUjIV4irwCrPc3_fIW2D8BmZ1g_JAck';
const parser = new PublicGoogleSheetsParser();

parser.parse(spreadsheetId).then((items) => {
  const propuestas = document.getElementById('propuestas');

  items.forEach(entry => {
    const propuesta = document.createElement("li");
    propuesta.innerHTML = entry.project || "No press links";
    propuestas.append(propuesta);
  });
});
