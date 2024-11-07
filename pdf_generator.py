from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from datetime import datetime
import os
import io

def generate_bill_pdf(bill, diagnoses, procedures):
    # Create a buffer to store PDF
    buffer = io.BytesIO()
    
    # Create the PDF object using the buffer
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Add header with logo and title
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "BillingDog")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, "Healthcare Billing Report")
    
    # Add patient information
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 120, "Patient Information")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 140, f"Name: {bill.patient_name}")
    c.drawString(50, height - 160, f"DOB: {bill.patient_dob.strftime('%m/%d/%Y')}")
    c.drawString(50, height - 180, f"Insurance: {bill.insurance_provider or 'Self Pay'}")
    if bill.policy_number:
        c.drawString(50, height - 200, f"Policy Number: {bill.policy_number}")
    
    # Add diagnoses with charges
    y_position = height - 250
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y_position, "Diagnoses")
    y_position -= 30
    
    # Create diagnoses table
    diagnoses_data = [["ICD-10 Code", "Description", "Amount"]]
    for diagnosis in diagnoses:
        diagnoses_data.append([
            diagnosis.icd10_code,
            diagnosis.description,
            f"${float(diagnosis.amount):.2f}"
        ])
    
    diagnoses_table = Table(diagnoses_data, colWidths=[1.2*inch, 4*inch, 1*inch])
    diagnoses_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
    ]))
    
    # Draw diagnoses table
    diagnoses_table.wrapOn(c, width - 100, height)
    diagnoses_table.drawOn(c, 50, y_position - len(diagnoses_data)*20)
    
    # Add procedures and charges
    y_position = y_position - len(diagnoses_data)*20 - 50
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y_position, "Procedures and Charges")
    y_position -= 30
    
    # Create procedures table
    procedures_data = [["CPT Code", "Description", "Amount"]]
    for procedure in procedures:
        procedures_data.append([
            procedure.cpt_code,
            procedure.description,
            f"${float(procedure.amount):.2f}"
        ])
    
    procedures_table = Table(procedures_data, colWidths=[1.2*inch, 4*inch, 1*inch])
    procedures_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
    ]))
    
    # Draw procedures table
    procedures_table.wrapOn(c, width - 100, height)
    procedures_table.drawOn(c, 50, y_position - len(procedures_data)*20)
    
    # Calculate subtotals
    diagnoses_total = sum(float(d.amount) for d in diagnoses)
    procedures_total = sum(float(p.amount) for p in procedures)
    
    # Add subtotals and total
    y_position = y_position - len(procedures_data)*20 - 40
    c.setFont("Helvetica", 12)
    c.drawString(width - 200, y_position, f"Diagnoses Subtotal: ${diagnoses_total:.2f}")
    y_position -= 20
    c.drawString(width - 200, y_position, f"Procedures Subtotal: ${procedures_total:.2f}")
    y_position -= 20
    c.setFont("Helvetica-Bold", 14)
    c.drawString(width - 200, y_position, f"Total Amount: ${float(bill.total_amount):.2f}")
    
    # Add footer
    c.setFont("Helvetica", 10)
    c.drawString(50, 30, f"Generated on: {datetime.now().strftime('%m/%d/%Y %H:%M:%S')}")
    c.drawString(width - 250, 30, "BillingDog Healthcare Billing System")
    c.drawString(50, 50, "This is a computer-generated document and does not require a signature.")
    
    # Save PDF
    c.save()
    buffer.seek(0)
    return buffer
