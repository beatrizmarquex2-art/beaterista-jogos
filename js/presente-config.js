// Presente do Paul: opções do formulário e os brindes por faixa de idade.
// ===== PRA LIGAR O PRESENTE: ponha os arquivos (PDF ou imagem pra pintar) em assets/presente/ e liste aqui. Sem nenhum arquivo, o cartão NÃO aparece pra ninguém. =====
export const FAIXAS = [['4-12', '4 a 12 anos'], ['13-17', '13 a 17 anos'], ['18-29', '18 a 29 anos'], ['30+', '30 anos ou mais']];
export const INSTRUMENTOS = [['bateria', 'Bateria'], ['guitarra', 'Guitarra'], ['teclado', 'Teclado'], ['violao', 'Violão'], ['outro', 'Outro']];
export const ICONE_INSTRUMENTO = { bateria: '🥁', guitarra: '🎸', teclado: '🎹', violao: '🎶', outro: '✨' };
/** 3 brindes diferentes; cada faixa de idade recebe um deles. `arquivos`: [{ nome, arquivo }] */
export const PRESENTES = {
  criancas: { titulo: 'Paul para colorir · crianças', arquivos: [] },
  jovens: { titulo: 'Paul para colorir · jovens', arquivos: [] },
  adultos: { titulo: 'Paul para colorir · adultos', arquivos: [] },
};
export const PRESENTE_DA_FAIXA = { '4-12': 'criancas', '13-17': 'jovens', '18-29': 'adultos', '30+': 'adultos' };
