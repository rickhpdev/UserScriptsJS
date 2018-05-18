Senior // ==UserScript==
// @name         Script Incluir Atividade Para Comentar Retro
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Marcação de Atividades (Atividades de Análise de BUGS) para Comentar na Retro
// @author       You
// @include      https://www.soc.com.br/WebSoc/sis050*
// @require      https://rickuserscript-bbcc.restdb.io/rest/_jsapi.js
// @require      https://rickuserscript-bbcc.restdb.io/assets/js/eventsource.min.js
// @grant        none
// ==/UserScript==

$(document).ready(function() {
    iniciaAplicacao();
});

var iniciaAplicacao = function(){
    adicionaClassesIconesAtividadeMarcadas();
    let promise = buscaAtividadesJaMarcadas();

    promise.then(atividadesJaMarcadas => {
        $('#minhaIteracao').on('click', function() {
            setTimeout(function(){
                percorreAtividadesAdicionandoBotoesAtividade(atividadesJaMarcadas);
            }, 1000);
        });
    })
    .catch(erro => console.log(erro));

    let conexaoComBDNoSql = criaConexaoComBDNoSql();
    aplicaEventosSelecaoAtividadeRetro(conexaoComBDNoSql);

};

var buscaAtividadesJaMarcadas = function (){
       return new Promise((resolve, reject) => {
           var arrayAtividadesJaMarcadas = [];
           settingsAjax.url =    endPointsRestDb.listarTodasAtividades.url;
           settingsAjax.method = endPointsRestDb.listarTodasAtividades.type;
           $.ajax(settingsAjax).done(function (response) {
               for(var i = 0; i < response.length; i++) {
                   var obj = response[i];
                   arrayAtividadesJaMarcadas.push(new AtividadesJaMarcadas(obj._id, obj.codigo_soc, obj.codigo_maestro, obj.dt_inserido, obj.cd_iteracao, obj.siglaColaboradorAtv));
               }
               resolve(arrayAtividadesJaMarcadas);
           })
           .fail(function (erro){
               reject(erro);
           });
       });
};

var percorreAtividadesAdicionandoBotoesAtividade = function (atividadesJaMarcadas){
    let htmlAtividadeSelec =    montaTagHtmlEmTexto('p', '', `${ClassesSelecaoAtividade.icone.classe} ${ClassesSelecaoAtividade.iconeAtividadeSelec.classe} dataTooltip`, `title="${ClassesSelecaoAtividade.iconeAtividadeSelec.mensagem}"`);
    let htmlAtividadeNaoSelec = montaTagHtmlEmTexto('p', '', `${ClassesSelecaoAtividade.icone.classe} ${ClassesSelecaoAtividade.iconeAtividadeNaoSelec.classe} dataTooltip`, `title="${ClassesSelecaoAtividade.iconeAtividadeNaoSelec.mensagem}"`);

    $("table#resultados tr.atividade[data-tituloatividade^='AJUSTE/MELHORIA']").each(function() {
        var countTd = 1;
        var $this = $(this);
        let codigoBug = retornaCodigoDoBugOlhandoNoTituloDaAtividade($this.data("tituloatividade"));
        $this.attr('data-codigobug', codigoBug);

        $this.children("td.siglasColaboradores.campo:visible").each(function(){
            let objComentarRetro = verificaSeAtividadeJaContidaNoArrayDeMarcadas(atividadesJaMarcadas, codigoBug);
            if(objComentarRetro){
                $this.attr('data-idatividademarcadabd', objComentarRetro.idBanco);
                $(this).append(htmlAtividadeSelec);
            }
            else
                $(this).append(htmlAtividadeNaoSelec);

            countTd++;
        });
    });
};

var retornaCodigoDoBugOlhandoNoTituloDaAtividade = function(tituloAtividade){
    var assuntoAtividadeCompleto = tituloAtividade.trim();
    var prefixoAtividadeComBug = assuntoAtividadeCompleto.split(":")[0];
    var regExp = /\d+/g;
    var matches = prefixoAtividadeComBug.match(regExp);
    return String(matches[0]);
};

var verificaSeAtividadeJaContidaNoArrayDeMarcadas = function (arrayMarcadas, codigoAtividadeSocAProcurar){
    return arrayMarcadas.find(function (elemento){
        return elemento.codigoSoc === codigoAtividadeSocAProcurar;
    });
};

var adicionaClassesIconesAtividadeMarcadas = function(){
    montaEAdicionaClassCssNoDOM(ClassesSelecaoAtividade.iconeAtividadeSelec.classe,    `background-image: url(${ClassesSelecaoAtividade.iconeAtividadeSelec.backgroundUrl}); float: right !important;`);
    montaEAdicionaClassCssNoDOM(ClassesSelecaoAtividade.iconeAtividadeNaoSelec.classe, `background-image: url(${ClassesSelecaoAtividade.iconeAtividadeNaoSelec.backgroundUrl}); float: right !important;`);
    montaEAdicionaClassCssNoDOM(ClassesSelecaoAtividade.iconeCarregandoAjax.classe,    `background-image: url(${ClassesSelecaoAtividade.iconeCarregandoAjax.backgroundUrl}); float: right !important;`);
    montaEAdicionaClassCssNoDOM(ClassesSelecaoAtividade.icone.classe, 'background-repeat: no-repeat;cursor: pointer;display: inline-block !important;float: left;min-height: 22px !important;width: 28px;background-size: 20px;');
};

var ClassesSelecaoAtividade = {
	iconeAtividadeSelec :    {classe:'icone-atividade-selecionada',      backgroundUrl:'https://d30y9cdsu7xlg0.cloudfront.net/png/3879-200.png',     mensagem: 'Desmarcar Atividade'},
	iconeAtividadeNaoSelec : {classe:'icone-atividade-nao-selecionada',  backgroundUrl:'http://www.clker.com/cliparts/3/h/N/y/5/p/empty-check-box-md.png', mensagem: 'Marcar Atividade'},
    icone :                  {classe:'icones',                           backgroundUrl:'',                                                                mensagem: ''},
    iconeCarregandoAjax :    {classe:'icone-carregando-ajax',            backgroundUrl:'https://www.soc.com.br/WebSoc/imagens/ajax_loaderCircle.gif',     mensagem: 'Carregando...'}
};

var montaTagHtmlEmTexto = function(tagName, tagConteudo, tagClasses, tagOutros){
    return `<${tagName} class="${returnIfVal(tagClasses)}" ${returnIfVal(tagOutros)}>
               ${returnIfVal(tagConteudo)}
            </${tagName}>`;
};

var returnIfVal = function(prop){
    return prop ? prop : "";
};

var montaEAdicionaClassCssNoDOM = function(nomeClasse, propriedadesClasse){
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.cssClass { color: #F00; }';
    style.innerHTML = `.${nomeClasse} { ${propriedadesClasse} }`;
    document.getElementsByTagName('head')[0].appendChild(style);
};

var criaObjetoAtvMarcadaConformeDadosDaTr = function($trComDadosDaAtv, conexaoComBd){
    let iteracaoDaAtividade = $trComDadosDaAtv.find('td:nth-child(8)').text().trim();
    let codigoBug = String($trComDadosDaAtv.data('codigobug'));
    let codigoMaestro = $trComDadosDaAtv.data('codigomaestro');
    let siglaColaboradorAtv = $trComDadosDaAtv.find('td:nth-child(3) .estiloSigla').text();
    let dataInserido = new Date();
    let objetoInstanciaFormatoDB = new AtividadesJaMarcadasFormatoBD(codigoBug, codigoMaestro, dataInserido, iteracaoDaAtividade, siglaColaboradorAtv);

    return new conexaoComBd.chamadosretro(objetoInstanciaFormatoDB);
};

//Promisse não funcionando como CallBack da API
var salvaObjetoAtividadeNoBD = function(objetoASerGravadoFormatoBD){
    return new Promise((resolve, reject) => {
        objetoASerGravadoFormatoBD.save(resolve);
    });
};

var deletaAtividadePeloId = function(idBancoAtividade){
    return new Promise((resolve, reject) => {
        let endPointDelete = `https://rickuserscript-bbcc.restdb.io/rest/chamadosretro/${idBancoAtividade}`;
        settingsAjax.url = endPointDelete;
        settingsAjax.method = endPointsRestDb.apagarAtividade.type;
        $.ajax(settingsAjax).done(function (response) {
            resolve(response);
        })
        .fail(function (erro){
            reject(erro);
        });
    });
};

var aplicaEventosSelecaoAtividadeRetro = function(conexaoComBDNoSql){

    $('#fieldsetResultado').on('click', `.${ClassesSelecaoAtividade.iconeAtividadeNaoSelec.classe}`,  function(e){
        let $imagemClicada = $(this);
        let $linhaClicada = $imagemClicada.closest('tr');
        let objetoBDComDadosDaAtividade = criaObjetoAtvMarcadaConformeDadosDaTr($linhaClicada, conexaoComBDNoSql);
        //PROMISE NÃO ESTÁ FUNCIONANDO com o CallBack da API, infelizmente. Feita Função anonima procedual por causa disso =/
        //let promise = salvaObjetoAtividadeNoBD(objetoBDComDadosDaAtividade);
        $imagemClicada.removeClass(ClassesSelecaoAtividade.iconeAtividadeNaoSelec.classe).addClass(ClassesSelecaoAtividade.iconeCarregandoAjax.classe);
        $imagemClicada.attr(`title`, ClassesSelecaoAtividade.iconeCarregandoAjax.mensagem);
        objetoBDComDadosDaAtividade.save(function (err, res) {
            if (!err){
                console.log('Persistido com Sucesso no BD');
                $linhaClicada.attr('data-idatividademarcadabd', res._id);
                $imagemClicada.addClass(ClassesSelecaoAtividade.iconeAtividadeSelec.classe);
                $imagemClicada.attr(`title`, ClassesSelecaoAtividade.iconeAtividadeSelec.mensagem);
            }
            else{
                $imagemClicada.addClass(ClassesSelecaoAtividade.iconeAtividadeNaoSelec.classe);
                $imagemClicada.attr(`title`, ClassesSelecaoAtividade.iconeAtividadeNaoSelec.mensagem);
                let msgErro = res ? res.responseText : 'Erro Não Identificado';
                alert('Falha ao Persistir no BD, ERRO: ' + res.responseText);
            }

            $imagemClicada.removeClass(ClassesSelecaoAtividade.iconeCarregandoAjax.classe);
        });

        e.stopPropagation();
    });

    $('#fieldsetResultado').on('click', `.${ClassesSelecaoAtividade.iconeAtividadeSelec.classe}`,  function(e){
        let $imagemClicada = $(this);
        let $linhaClicada = $imagemClicada.closest('tr');
        let idBancoAtividade = $linhaClicada.data('idatividademarcadabd');

        if(!idBancoAtividade){
            alert('Não foi encontrado o ID Relacionado com Essa Atividade, Recarregue a "Minha Iteração"');
            return;
        }
        let classIconeAdicionar;
        let mensagemToolTipAdicionar;
        $imagemClicada.removeClass(ClassesSelecaoAtividade.iconeAtividadeNaoSelec.classe).addClass(ClassesSelecaoAtividade.iconeCarregandoAjax.classe);
        $imagemClicada.attr(`title`, ClassesSelecaoAtividade.iconeCarregandoAjax.mensagem);
        let promise = deletaAtividadePeloId(idBancoAtividade);

        promise.then(response => {
            classIconeAdicionar = ClassesSelecaoAtividade.iconeAtividadeNaoSelec.classe;
            mensagemToolTipAdicionar = ClassesSelecaoAtividade.iconeAtividadeNaoSelec.mensagem;
            $linhaClicada.attr('data-idatividademarcadabd', '');
            console.log(response);
        })
        .catch(erro =>  {
            classIconeAdicionar = ClassesSelecaoAtividade.iconeAtividadeSelec.classe;
            mensagemToolTipAdicionar = ClassesSelecaoAtividade.iconeAtividadeSelec.mensagem;
            console.log(erro);
        })
        .finally(function() {
            $imagemClicada.removeClass(ClassesSelecaoAtividade.iconeCarregandoAjax.classe);
            $imagemClicada.addClass(classIconeAdicionar);
            $imagemClicada.attr(`title`, mensagemToolTipAdicionar);
        });

        e.stopPropagation();
    });
};

class AtividadesJaMarcadas {
    constructor(idBanco, codigoSoc, codigoMaestro, dtInserido, cdIteracao, siglaColaboradorAtv){
        this.idBanco = idBanco;
        this.codigoSoc = codigoSoc;
        this.codigoMaestro = codigoMaestro;
        this.dtInserido = dtInserido;
        this.cdIteracao = cdIteracao;
        this.siglaColaboradorAtv = siglaColaboradorAtv;
    }
}

class AtividadesJaMarcadasFormatoBD {
    constructor(codigoSoc, codigoMaestro, dtInserido, cdIteracao, siglaColaboradorAtv){
        this.codigo_soc = codigoSoc;
        this.codigo_maestro = codigoMaestro;
        this.dt_inserido = dtInserido;
        this.cd_iteracao = cdIteracao;
        this.sigla_colaborador = siglaColaboradorAtv;
    }
}

var settingsAjax = {
    "async": true,
    "crossDomain": true,
    "url": "https://rickuserscript-bbcc.restdb.io/rest/chamadosretro",
    "method": "GET",
    "headers": {
      "content-type": "application/json",
      "x-apikey": "5a2065627814ac5b3a05f4fd",
      "cache-control": "no-cache"
	}
};

var endPointsRestDb = {
    listarTodasAtividades: {url: 'https://rickuserscript-bbcc.restdb.io/rest/chamadosretro', type : 'GET'},
    apagarAtividade : {url: 'https://rickuserscript-bbcc.restdb.io/rest/chamadosretro/', type: 'DELETE'}
};

var criaConexaoComBDNoSql = function (){
    return new restdb(ChavesConexaoBDNoSql.CHAVE_ACESSO_TOTAL, {"url": "", "logging": true, "realtime": true,"jwt": false});
};

var ChavesConexaoBDNoSql = {
    CHAVE_ACESSO_TOTAL : 'MY_PRIVATE_KEY',
    CHAVE_ACESSO_GET : '5a27fa5a7814ac5b3a05f69b',
};
