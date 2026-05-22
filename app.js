// Banco de dados em memória
let db = { loans: [] };

// Configurações do Ouroboros
const TAXA_BASE = 0.05; // 5%
const INCREMENTO_PARCELA = 0.005; // +0.5% por parcela extra
const TAXA_CDI_MENSAL = 0.01; // ~1% ao mês (simulando 120% do CDI)

// Formatador de Moeda
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// --------------------------------------------------
// 1. Matemática
// --------------------------------------------------
function calcularTaxa(n) {
    return TAXA_BASE + (INCREMENTO_PARCELA * (n - 1));
}

function calcularTabelaPrice(principal, taxa, parcelas) {
    if (taxa === 0) return principal / parcelas;
    return principal * (taxa * Math.pow(1 + taxa, parcelas)) / (Math.pow(1 + taxa, parcelas) - 1);
}

function calcularRendimentoCDI(principal, meses) {
    // Calcula quanto o dinheiro renderia se ficasse parado no CDI
    return principal * (Math.pow(1 + TAXA_CDI_MENSAL, meses) - 1);
}

// --------------------------------------------------
// 2. Lógica do Formulário & Preview
// --------------------------------------------------
document.getElementById('loanAmount').addEventListener('input', function(e) {
    const amount = parseFloat(e.target.value);
    const previewDiv = document.getElementById('installmentPreview');
    
    if (isNaN(amount) || amount <= 0) {
        previewDiv.innerHTML = '';
        return;
    }

    let tableHtml = `
        <table role="grid">
            <thead>
                <tr>
                    <th>Vezes</th>
                    <th>Parcela</th>
                    <th>Lucro Ouroboros</th>
                    <th>CDI Perdido (120%)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (let i = 1; i <= 12; i++) {
        const taxa = calcularTaxa(i);
        const pmt = calcularTabelaPrice(amount, taxa, i);
        const lucroOuroboros = (pmt * i) - amount;
        const lucroCDI = calcularRendimentoCDI(amount, i);
        
        tableHtml += `
            <tr>
                <td>${i}x</td>
                <td>${BRL.format(pmt)}</td>
                <td style="color: #2ecc71;"><strong>${BRL.format(lucroOuroboros)}</strong></td>
                <td style="color: #f39c12;">${BRL.format(lucroCDI)}</td>
            </tr>
        `;
    }
    tableHtml += '</tbody></table>';
    previewDiv.innerHTML = tableHtml;
});

document.getElementById('loanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('loanName').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const installments = parseInt(document.getElementById('loanInstallments').value);
    
    const taxaAplicada = calcularTaxa(installments);
    const valorParcela = calcularTabelaPrice(amount, taxaAplicada, installments);
    const totalPago = valorParcela * installments;
    const lucro = totalPago - amount;
    const lucroCDI = calcularRendimentoCDI(amount, installments);

    const novoEmprestimo = {
        id: Date.now(),
        name,
        amount,
        installments,
        taxaAplicada,
        valorParcela,
        totalPago,
        lucro,
        lucroCDI, // Salva o CDI perdido para o histórico
        parcelasPagas: 0,
        dataCriacao: new Date().toISOString(),
        historicoPagamentos: []
    };

    db.loans.push(novoEmprestimo);
    renderDashboard();
    
    this.reset();
    document.getElementById('installmentPreview').innerHTML = '';
    document.getElementById('loansList').scrollIntoView({ behavior: 'smooth' });
});

// --------------------------------------------------
// 3. Ações do Contrato (Pagar & Exportar)
// --------------------------------------------------
function pagarParcela(loanId) {
    const loan = db.loans.find(l => l.id === loanId);
    if (loan && loan.parcelasPagas < loan.installments) {
        loan.parcelasPagas++;
        loan.historicoPagamentos.push({
            parcelaNumero: loan.parcelasPagas,
            dataPagamento: new Date().toISOString(),
            valorPago: loan.valorParcela
        });
        renderDashboard();
    }
}

function baixarCalendario(loanId) {
    const loan = db.loans.find(l => l.id === loanId);
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Ouroboros//Self-Banking//PT\n";
    let dataCriacao = new Date(loan.dataCriacao);
    
    for (let i = 1; i <= loan.installments; i++) {
        let dataParcela = new Date(dataCriacao);
        dataParcela.setMonth(dataCriacao.getMonth() + i);
        
        let dtStart = dataParcela.toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
        
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `UID:${loan.id}-${i}@ouroboros\n`;
        icsContent += `DTSTAMP:${dtStart}\n`;
        icsContent += `DTSTART:${dtStart}\n`;
        icsContent += `SUMMARY:Ouroboros: ${loan.name} (${i}/${loan.installments})\n`;
        icsContent += `DESCRIPTION:Valor a repor: ${BRL.format(loan.valorParcela)}\n`;
        icsContent += "END:VEVENT\n";
    }
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calendario_ouroboros_${loan.name.replace(/\s+/g, '_')}.ics`;
    link.click();
}

// --------------------------------------------------
// 4. I/O de Dados (Backup)
// --------------------------------------------------
function downloadJSON() {
    if (db.loans.length === 0) {
        alert("Não há dados para salvar.");
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `ouroboros_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
}

document.getElementById('uploadJson').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            db = JSON.parse(e.target.result);
            renderDashboard();
        } catch (err) {
            alert("Arquivo JSON inválido.");
        }
    };
    reader.readAsText(file);
});

// --------------------------------------------------
// 5. Motor de Renderização
// --------------------------------------------------
function renderizarGraficoFluxo() {
    let fluxoMensal = {};
    
    db.loans.forEach(loan => {
        if (loan.parcelasPagas >= loan.installments) return;
        
        const dataCriacao = new Date(loan.dataCriacao);
        
        for (let i = loan.parcelasPagas + 1; i <= loan.installments; i++) {
            let dataParcela = new Date(dataCriacao);
            dataParcela.setMonth(dataCriacao.getMonth() + i);
            
            let chaveMes = `${dataParcela.getFullYear()}-${String(dataParcela.getMonth() + 1).padStart(2, '0')}`;
            if (!fluxoMensal[chaveMes]) fluxoMensal[chaveMes] = 0;
            fluxoMensal[chaveMes] += loan.valorParcela;
        }
    });

    const chaves = Object.keys(fluxoMensal);
    const divGrafico = document.getElementById('graficoFluxo');
    
    if (chaves.length === 0) {
        divGrafico.innerHTML = '<p style="text-align: center; color: #888;">Nenhuma parcela pendente prevista.</p>';
        return;
    }

    const maxValor = Math.max(...Object.values(fluxoMensal));
    const mesesOrdenados = chaves.sort();
    
    let htmlGrafico = '<div class="chart-container">';
    
    mesesOrdenados.forEach(mes => {
        const valor = fluxoMensal[mes];
        const percentAltura = Math.max((valor / maxValor) * 100, 5); 
        
        const [ano, numMes] = mes.split('-');
        const nomeMes = new Date(ano, parseInt(numMes) - 1).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });

        htmlGrafico += `
            <div class="chart-bar-wrapper">
                <span style="font-size:0.8em; margin-bottom:5px; color:#aaa;">${BRL.format(valor)}</span>
                <div class="chart-bar" style="height: ${percentAltura}%;"></div>
                <span style="font-size:0.8em; margin-top:5px; text-transform: capitalize;">${nomeMes}</span>
            </div>
        `;
    });
    
    htmlGrafico += '</div>';
    divGrafico.innerHTML = htmlGrafico;
}

function renderDashboard() {
    let totalPrincipal = 0;
    let totalLucro = 0;
    const list = document.getElementById('loansList');
    list.innerHTML = '';

    if (db.loans.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #888;">Nenhum empréstimo ativo.</p>';
    } else {
        db.loans.forEach(loan => {
            totalPrincipal += loan.amount;
            totalLucro += loan.lucro;

            const pRestantes = loan.installments - loan.parcelasPagas;
            const progress = (loan.parcelasPagas / loan.installments) * 100;
            const isQuitado = pRestantes === 0;
            
            // Fallback caso carregue um JSON antigo que não tinha o lucroCDI
            const cdi = loan.lucroCDI || calcularRendimentoCDI(loan.amount, loan.installments);

            list.innerHTML += `
                <article style="${isQuitado ? 'opacity: 0.7;' : ''}">
                    <header>
                        <strong>${loan.name} ${isQuitado ? '✅ (Quitado)' : ''}</strong> 
                        <span style="float:right;">Taxa: ${(loan.taxaAplicada * 100).toFixed(1)}% a.m.</span>
                    </header>
                    <div class="grid">
                        <div>
                            <small>Capital Emprestado</small>
                            <br><strong>${BRL.format(loan.amount)}</strong>
                        </div>
                        <div>
                            <small>Lucro Ouroboros</small>
                            <br><strong style="color: #2ecc71;">${BRL.format(loan.lucro)}</strong>
                        </div>
                        <div>
                            <small>CDI Perdido</small>
                            <br><strong style="color: #f39c12;">${BRL.format(cdi)}</strong>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem;">
                        <small style="display:block; margin-bottom:0.5rem;">Status: ${loan.parcelasPagas} de ${loan.installments} pagas</small>
                        <progress value="${progress}" max="100"></progress>
                    </div>

                    <footer class="loan-actions">
                        <button class="primary" onclick="pagarParcela(${loan.id})" ${isQuitado ? 'disabled' : ''}>
                            ✔️ Pagar ${isQuitado ? '' : `(${BRL.format(loan.valorParcela)})`}
                        </button>
                        <button class="outline" onclick="baixarCalendario(${loan.id})">
                            📅 Exportar Lembretes
                        </button>
                    </footer>
                </article>
            `;
        });
    }

    document.getElementById('totalPrincipal').innerText = BRL.format(totalPrincipal);
    document.getElementById('totalLucro').innerText = BRL.format(totalLucro);
    
    renderizarGraficoFluxo();
}

renderDashboard();