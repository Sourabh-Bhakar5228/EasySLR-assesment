import zipfile
import xml.etree.ElementTree as ET
import os

def get_docx_text(path):
    try:
        doc = zipfile.ZipFile(path)
        xml_content = doc.read('word/document.xml')
        root = ET.fromstring(xml_content)
        paragraphs = []
        for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [node.text for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            if texts:
                paragraphs.append("".join(texts))
        return "\n".join(paragraphs)
    except Exception as e:
        return f"Error: {str(e)}"

def get_xlsx_data(path):
    try:
        doc = zipfile.ZipFile(path)
        strings = []
        if 'xl/sharedStrings.xml' in doc.namelist():
            xml_content = doc.read('xl/sharedStrings.xml')
            root = ET.fromstring(xml_content)
            for t in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                strings.append(t.text)
        
        xml_content = doc.read('xl/worksheets/sheet1.xml')
        root = ET.fromstring(xml_content)
        
        rows = []
        for row in root.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_data = []
            for cell in row.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                t = cell.get('t')
                v_node = cell.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v_node.text if v_node is not None else ""
                
                if t == 's' and val:
                    val = strings[int(val)]
                row_data.append(val)
            rows.append("\t".join(map(str, row_data)))
        return "\n".join(rows)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    docx_path = "EasySLR Engineering Assignment - Software Engineer.docx"
    xlsx_path = "sample_article_import.xlsx"
    
    if os.path.exists(docx_path):
        text = get_docx_text(docx_path)
        with open("docx_content.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Extracted Word Doc to docx_content.txt")
        
    if os.path.exists(xlsx_path):
        data = get_xlsx_data(xlsx_path)
        with open("xlsx_content.txt", "w", encoding="utf-8") as f:
            f.write(data)
        print("Extracted Excel Sheet to xlsx_content.txt")
