const spreadsheetId = '1kAQ344FGDrWCJUjIV4irwCrPc3_fIW2D8BmZ1g_JAck';
const parser = new PublicGoogleSheetsParser();
const subparser = new PublicGoogleSheetsParser();

parser.setOption({ sheetId: '885988754' })
parser.parse(spreadsheetId).then((items) => {
  const propuestas = document.getElementById('propuestas');

  items
    .forEach(entry => {
      const propuesta = document.createElement("li");
      propuesta.innerHTML = entry.project_name || "No press links";
      propuestas.appendChild(propuesta);

      const noticias = document.createElement("ul");
      propuesta.appendChild(noticias);

      subparser.setOption({ sheetName: entry.project_id })
      subparser.parse(spreadsheetId).then((subprojectItems) => {
        subprojectItems
          .forEach(sub => {
            const news_link = document.createElement("li");
            news_link.innerHTML = `<a href=${sub.news_link} target="_blank">${sub.news_link}</a>`;
            noticias.appendChild(news_link);
          })
      })
    })
});
