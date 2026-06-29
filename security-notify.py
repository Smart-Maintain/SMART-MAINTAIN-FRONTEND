import os
import json
import requests
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def parse_all_sources():
    all_vulns = []
    
    # 1. Parsing SEMGREP
    try:
        with open('semgrep-results.json', 'r') as f:
            data = json.load(f)
            for r in data.get('results', []):
                path = r.get('path', 'Inconnu')
                line = r.get('start', {}).get('line', '?')
                msg = r.get('extra', {}).get('message', '').split('\n')[0]
                all_vulns.append(["Semgrep", "HIGH", f"{path}:{line}", msg[:60]])
    except Exception:
        pass

    # 2. Parsing SNYK (Prend absolument TOUT)
    try:
        with open('snyk-results.json', 'r') as f:
            data = json.load(f)
            vulns_list = []
            if isinstance(data, list):
                for repo in data:
                    vulns_list.extend(repo.get('vulnerabilities', []))
            else:
                vulns_list = data.get('vulnerabilities', [])
                
            for v in vulns_list:
                pkg = v.get('packageName', 'Inconnu')
                ver = v.get('version', '?')
                title = v.get('title', 'Faille')
                sev = v.get('severity', 'LOW').upper()
                all_vulns.append(["Snyk (SCA)", sev, f"{pkg}@{ver}", title[:60]])
    except Exception:
        pass

    # 3. Parsing TRIVY
    try:
        with open('trivy-results.json', 'r') as f:
            data = json.load(f)
            for result in data.get('Results', []):
                target = result.get('Target', 'Fichier')
                for v in result.get('Vulnerabilities', []):
                    v_id = v.get('VulnerabilityID', 'Inconnu')
                    sev = v.get('Severity', 'LOW').upper()
                    title = v.get('Title', 'Faille config')
                    all_vulns.append(["Trivy", sev, target, f"{v_id} - {title[:40]}"])
    except Exception:
        pass

    return all_vulns

def generate_pdf(vulns, repo_name, filename="rapport-securite.pdf"):
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()
    
    # Styles personnalisés
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=20, spaceAfter=20, textColor=colors.HexColor("#1A365D"))
    text_style = ParagraphStyle('TextStyle', parent=styles['Normal'], fontSize=10, spaceAfter=10)
    
    story.append(Paragraph("Rapport Global Audits de Sécurité DevSecOps", title_style))
    story.append(Paragraph(f"Projet : <b>{repo_name}</b>", text_style))
    story.append(Paragraph(f"Total des vulnérabilités recensées : <b>{len(vulns)}</b>", text_style))
    story.append(Spacer(1, 15))
    
    # En-tête du tableau
    table_data = [["Outil", "Criticité", "Composant / Fichier", "Description / Faille"]]
    
    for v in vulns:
        table_data.append(v)
        
    # Création du tableau avec mise en page automatique des cellules
    formatted_table_data = []
    for row in table_data:
        formatted_row = [Paragraph(str(cell), styles['Normal']) if isinstance(cell, str) else cell for cell in row]
        formatted_table_data.append(formatted_row)

    t = Table(formatted_table_data, colWidths=[80, 60, 140, 260])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1A365D")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#F7FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    
    story.append(t)
    doc.build(story)

def send_telegram_pdf(pdf_path, total_count, repo_name):
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    if not token or not chat_id:
        print("Erreur: TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant.")
        return
    
    # 1. Envoi du petit message texte d'alerte
    text_url = f"https://api.telegram.org/bot{token}/sendMessage"
    msg = f"🛡️ *Rapport de Sécurité DevSecOps*\n📌 *Projet:* `{repo_name}`\n\n🚨 L'analyse complète est terminée. *{total_count}* vulnérabilités globales ont été trouvées.\n\n📂 _Le rapport PDF détaillé est joint à ce message._"
    requests.post(text_url, json={"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"})
    
    # 2. Envoi du fichier PDF généré
    doc_url = f"https://api.telegram.org/bot{token}/sendDocument"
    with open(pdf_path, 'rb') as pdf_file:
        files = {'document': pdf_file}
        data = {'chat_id': chat_id}
        requests.post(doc_url, data=data, files=files)

if __name__ == "__main__":
    # Récupération automatique du nom du dépôt actuel depuis GitHub Actions
    repo_full = os.environ.get('GITHUB_REPOSITORY', 'SMART-MAINTAIN-FRONTEND')
    repo_clean = repo_full.split('/')[-1] # Extrait juste 'SMART-MAINTAIN-FRONTEND'
    
    vulns_list = parse_all_sources()
    pdf_name = "rapport-securite.pdf"
    
    # Génère le PDF avec l'intégralité des lignes
    generate_pdf(vulns_list, repo_clean, pdf_name)
    
    # Envoie le fichier sur Telegram
    send_telegram_pdf(pdf_name, len(vulns_list), repo_clean)
    print(f"Rapport PDF pour {repo_clean} généré et envoyé avec succès !")
