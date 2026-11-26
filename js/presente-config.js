// Presente do Paul: opções do formulário e os brindes por faixa de idade.
// ===== PRA LIGAR O PRESENTE: ponha os arquivos (PDF ou imagem) em assets/presente/ e liste aqui. Sem nenhum arquivo, o cartão NÃO aparece pra ninguém. =====
export const FAIXAS = [['4-12', '4 a 12 anos'], ['13-17', '13 a 17 anos'], ['18-29', '18 a 29 anos'], ['30+', '30 anos ou mais']];
export const INSTRUMENTOS = [['bateria', 'Bateria'], ['guitarra', 'Guitarra'], ['teclado', 'Teclado'], ['violao', 'Violão'], ['outro', 'Outro']];
export const ICONE_INSTRUMENTO = { bateria: '🥁', guitarra: '🎸', teclado: '🎹', violao: '🪕', outro: '✨' };
/** Os presentes que a pessoa pode ESCOLHER (1 deles). `arquivos`: [{ nome, arquivo, faixas? }]. `faixas` (opcional) = só pra essas idades (ex.: ['4-12']); `instrumentos` (opcional) = só pra quem escolheu esse instrumento no formulário (quem escolheu "Outro" ou ainda não disse recebe todos);
 *  sem `faixas`, vale pra todo mundo. Um presente sem nenhum arquivo não aparece na escolha. */
export const PRESENTES = {
  planner: { titulo: 'Planner de estudo', icone: '🗓️', desc: 'organize seus estudos de música', arquivos: [
    { nome: 'Bateria · Cada batida é um passo', arquivo: 'assets/presente/planner/bateria-1-cada-batida.pdf', mini: 'assets/presente/planner/bateria-1-cada-batida-mini.webp', instrumentos: ['bateria'] },
    { nome: 'Bateria · Disciplina no estudo, liberdade no palco', arquivo: 'assets/presente/planner/bateria-2-disciplina-no-palco.pdf', mini: 'assets/presente/planner/bateria-2-disciplina-no-palco-mini.webp', instrumentos: ['bateria'] },
    { nome: 'Bateria · Planner vermelho', arquivo: 'assets/presente/planner/bateria-3-vermelho.pdf', mini: 'assets/presente/planner/bateria-3-vermelho-mini.webp', instrumentos: ['bateria'] },
    { nome: 'Guitarra · Planner vermelho', arquivo: 'assets/presente/planner/guitarra-1-vermelho.pdf', mini: 'assets/presente/planner/guitarra-1-vermelho-mini.webp', instrumentos: ['guitarra'] },
    { nome: 'Teclado · Toque suas ideias', arquivo: 'assets/presente/planner/teclado-1-toque-suas-ideias.pdf', mini: 'assets/presente/planner/teclado-1-toque-suas-ideias-mini.webp', instrumentos: ['teclado'] },
    { nome: 'Teclado · Minha semana musical', arquivo: 'assets/presente/planner/teclado-2-minha-semana.pdf', mini: 'assets/presente/planner/teclado-2-minha-semana-mini.webp', instrumentos: ['teclado'] },
    { nome: 'Teclado · Planner vermelho', arquivo: 'assets/presente/planner/teclado-3-vermelho.pdf', mini: 'assets/presente/planner/teclado-3-vermelho-mini.webp', instrumentos: ['teclado'] },
    { nome: 'Violão · Dedilhe seus sonhos', arquivo: 'assets/presente/planner/violao-1-dedilhe-seus-sonhos.pdf', mini: 'assets/presente/planner/violao-1-dedilhe-seus-sonhos-mini.webp', instrumentos: ['violao'] },
    { nome: 'Violão · Meu planner de violão', arquivo: 'assets/presente/planner/violao-2-meu-planner.pdf', mini: 'assets/presente/planner/violao-2-meu-planner-mini.webp', instrumentos: ['violao'] },
    { nome: 'Violão · Planner vermelho', arquivo: 'assets/presente/planner/violao-3-vermelho.pdf', mini: 'assets/presente/planner/violao-3-vermelho-mini.webp', instrumentos: ['violao'] },
  ] },
  wallpaper: { titulo: 'Wallpaper', icone: '📱', desc: 'o Paul no fundo da tela do seu celular', arquivos: [] },
  colorir: { titulo: 'Para colorir', icone: '🎨', desc: 'desenhos do Paul pra você colorir', arquivos: [
    { nome: 'Oi! Sou o Paul!', arquivo: 'assets/presente/colorir/01-oi-sou-o-paul.pdf', mini: 'assets/presente/colorir/01-oi-sou-o-paul-mini.webp' },
    { nome: 'Aqui a música é divertida!', arquivo: 'assets/presente/colorir/02-escola-beaterista.pdf', mini: 'assets/presente/colorir/02-escola-beaterista-mini.webp' },
    { nome: 'Música é atitude', arquivo: 'assets/presente/colorir/03-musica-e-atitude.pdf', mini: 'assets/presente/colorir/03-musica-e-atitude-mini.webp', faixas: ['13-17', '18-29', '30+'] },
    { nome: 'Paul de skate', arquivo: 'assets/presente/colorir/04-paul-de-skate.pdf', mini: 'assets/presente/colorir/04-paul-de-skate-mini.webp', faixas: ['4-12', '13-17'] },
    { nome: 'Aqui é Beaterista', arquivo: 'assets/presente/colorir/05-aqui-e-beaterista.pdf', mini: 'assets/presente/colorir/05-aqui-e-beaterista-mini.webp', faixas: ['13-17', '18-29', '30+'] },
    { nome: 'Sobe o som', arquivo: 'assets/presente/colorir/06-sobe-o-som.pdf', mini: 'assets/presente/colorir/06-sobe-o-som-mini.webp', faixas: ['13-17', '18-29', '30+'] },
    { nome: 'Foco no ritmo', arquivo: 'assets/presente/colorir/07-foco-no-ritmo.pdf', mini: 'assets/presente/colorir/07-foco-no-ritmo-mini.webp' },
    { nome: 'Crie sem medo', arquivo: 'assets/presente/colorir/08-crie-sem-medo.pdf', mini: 'assets/presente/colorir/08-crie-sem-medo-mini.webp', faixas: ['13-17', '18-29', '30+'] },
    { nome: 'Ensinar música é preparar para a vida', arquivo: 'assets/presente/colorir/09-ensinar-musica.pdf', mini: 'assets/presente/colorir/09-ensinar-musica-mini.webp', faixas: ['18-29', '30+'] },
    { nome: 'A música desenvolve foco e criatividade', arquivo: 'assets/presente/colorir/10-musica-desenvolve.pdf', mini: 'assets/presente/colorir/10-musica-desenvolve-mini.webp', faixas: ['18-29', '30+'] },
    { nome: 'Oi! Sou o Paul! (pequenos)', arquivo: 'assets/presente/colorir/11-paul-bebe.pdf', mini: 'assets/presente/colorir/11-paul-bebe-mini.webp', faixas: ['4-12'] },
    { nome: 'Brincar também é aprender!', arquivo: 'assets/presente/colorir/12-brincar-e-aprender.pdf', mini: 'assets/presente/colorir/12-brincar-e-aprender-mini.webp', faixas: ['4-12'] },
    { nome: 'A música acompanha a gente!', arquivo: 'assets/presente/colorir/13-musica-acompanha.pdf', mini: 'assets/presente/colorir/13-musica-acompanha-mini.webp', faixas: ['4-12'] },
  ] },
};
