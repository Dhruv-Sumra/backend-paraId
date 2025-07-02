import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv'

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);  
const __dirname = path.dirname(__filename);

// Create transporter
const createTransporter = () => {
  // Debug: Log all environment variables
  console.log('=== Email Service Debug ===');
  console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL);   
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);
  console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
  
  // Temporary hardcoded values for testing
  const emailUser = process.env.SENDER_EMAIL || 'dhruvsumra13@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD || 'rwrzljvqtmjgbaxq';
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  console.log('Using email config:', { emailUser, emailService });
  
  // Check if email configuration is available
  if (!emailUser || !emailPassword) {
    console.warn('Email configuration not found. Email functionality will be disabled.');
    console.warn('Required: SENDER_EMAIL and EMAIL_PASSWORD environment variables');
    return null;
  }

  return nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPassword 
    }
  });
};

export const sendIdCardEmail = async (player, idCardPath) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (email not configured), just log and return
    if (!transporter) {
      console.log(`Email not sent to ${player.email} - email service not configured`);
      return { messageId: 'email-not-configured' };
    }
    
    // Full path to ID card
    const fullIdCardPath = path.join(__dirname, '..', idCardPath);
    
    // Check if ID card file exists
    if (!fs.existsSync(fullIdCardPath)) {
      throw new Error('ID card file not found');
    }
    
    // Get email configuration
    const emailUser = process.env.SENDER_EMAIL || 'gujaratparasports@gmail.com';
    
    const mailOptions = {
      from: emailUser,
      to: player.email,
      subject: 'Your Para Sports ID Card - તમારું પેરા સ્પોર્ટ્સ આઈડી કાર્ડ',
      html: `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 100%; margin: 0 auto; padding: 20px; background: #f5f5f5; box-sizing: border-box;">
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 40px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h1 style="margin: 0; font-size: 36px; font-weight: bold;">Para Sports ID Card</h1>
            <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9;">પેરા સ્પોર્ટ્સ આઈડી કાર્ડ</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #1e3c72; margin-top: 0; font-size: 28px; text-align: center;">Hello ${player.firstName}!</h2>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 6px solid #1e3c72; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h3 style="color: #1e3c72; margin-top: 0; font-size: 22px;">Your Player Information - તમારી માહિતી:</h3>
              <ul style="color: #333; line-height: 2.0; font-size: 16px; margin: 20px 0;">
                <li><strong>Player ID:</strong> ${player.playerId}</li>
                <li><strong>Name:</strong> ${player.firstName} ${player.lastName}</li>
                <li><strong>Primary Sport:</strong> ${player.primarySport}</li>
                <li><strong>Registration Date:</strong> ${new Date(player.registrationDate).toLocaleDateString()}</li>
              </ul>
            </div>
            
            <div style="background: #e8f4fd; padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 6px solid #1e3c72; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h3 style="color: #1e3c72; margin-top: 0; text-align: center; font-size: 24px;">પેરા સ્પોર્ટ્સ આઈડી કાર્ડ - સંદેશ</h3>
              
              <div style="text-align: center; margin-bottom: 25px;">
                <p style="color: #1e3c72; font-weight: bold; margin: 0; font-size: 18px;">પ્રતિ,</p>
                <p style="color: #1e3c72; font-weight: bold; margin: 8px 0; font-size: 18px;">શ્રી ${player.firstName} ${player.lastName}</p>
                <p style="color: #1e3c72; font-weight: bold; margin: 8px 0; font-size: 18px;">પ્લેયર આઈડી: ${player.playerId}</p>
              </div>
              
              <div style="text-align: justify; line-height: 2.0; color: #333; font-size: 16px;">
                <p style="margin-bottom: 20px;">
                  આદનીય શ્રી,
                </p>
                
                <p style="margin-bottom: 20px;">
                  મને તમને જણાવતા આનંદ થાય છે કે તમારું પેરા સ્પોર્ટ્સ આઈડી કાર્ડ સફળતાપૂર્વક જનરેટ થઈ ગયું છે. આ આઈડી કાર્ડ તમારી ઓફિસિયલ ઓળખ માટે છે અને તમે તેને તમારી સાથે રાખી શકો છો.
                </p>
                
                <p style="margin-bottom: 20px;">
                  <strong>મહત્વની નોંધ:</strong>
                </p>
                <ul style="margin-left: 25px; margin-bottom: 20px;">
                  <li>આ આઈડી કાર્ડ તમારી સાથે રાખવું જરૂરી છે</li>
                  <li>કોઈપણ પેરા સ્પોર્ટ્સ ઇવેન્ટમાં આ કાર્ડ જરૂરી છે</li>
                  <li>કાર્ડ પરનો QR કોડ તમારી સંપૂર્ણ માહિતી ધરાવે છે</li>
                  <li>કોઈપણ માહિતી અપડેટ કરવા માટે સંપર્ક કરો</li>
                </ul>
                
                <p style="margin-bottom: 20px;">
                  તમારા પ્રદર્શન માટે શુભેચ્છાઓ!
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 25px; border-top: 2px solid #ddd; padding-top: 20px;">
                <p style="color: #666; margin: 8px 0; font-size: 16px;">આપનો વિશ્વાસુ,</p>
                <p style="color: #1e3c72; font-weight: bold; margin: 8px 0; font-size: 18px;">પેરા સ્પોર્ટ્સ એસોસિયેશન ઓફ ગુજરાત</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Para Sports Association of Gujarat. All rights reserved.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `Para_Sports_ID_Card_${player.playerId}.pdf`,
          path: fullIdCardPath,
          cid: 'idcard'
        }
      ]
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    // Delete the PDF file after successfully sending the email
    try {
      if (fs.existsSync(fullIdCardPath)) {
        fs.unlinkSync(fullIdCardPath);
        console.log(`ID card PDF deleted successfully: ${fullIdCardPath}`);
      }
    } catch (deleteError) {
      console.error('Error deleting ID card PDF:', deleteError);
      // Don't fail the email sending if deletion fails
    }
    
    return info;
    
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw error, just log it so registration doesn't fail
    return { error: 'Failed to send email', details: error.message };
  }
};

export const sendWelcomeEmail = async (player) => {
  try {
    const transporter = createTransporter();
    
    // If no transporter (email not configured), just log and return
    if (!transporter) {
      console.log(`Welcome email not sent to ${player.email} - email service not configured`);
      return { messageId: 'email-not-configured' };
    }
    
    // Get email configuration
    const emailUser = process.env.SENDER_EMAIL || 'dhruvsumra13@gmail.com';
    
    const mailOptions = {
      from: emailUser,
      to: player.email,
      subject: 'Welcome to Para Sports! - પેરા સ્પોર્ટ્સમાં સ્વાગત છે!',
      html: `
        <div style="font-family: Arial, sans-serif; width: 100%; max-width: 100%; margin: 0 auto; padding: 0; background: #f5f5f5; box-sizing: border-box;">
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 40px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Welcome to Para Sports!</h1>
            <p style="margin: 15px 0 0 0; font-size: 20px; opacity: 0.9;">પેરા સ્પોર્ટ્સમાં સ્વાગત છે!</p>
          </div>
          
          <div style="background: white; padding: 3px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h2 style="color: #1e3c72; margin-top: 0; font-size: 28px; text-align: center;">Hello ${player.firstName}!</h2>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 6px solid #1e3c72; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h3 style="color: #1e3c72; margin-top: 0; font-size: 22px;">Your Player ID - તમારું પ્લેયર આઈડી:</h3>
              <p style="color: #333; line-height: 1.6; font-size: 24px; font-weight: bold; text-align: center;">
                <strong>${player.playerId}</strong>
              </p>
            </div>
            
            <div style="background: #e8f4fd; padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 6px solid #1e3c72; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h3 style="color: #1e3c72; margin-top: 0; text-align: center; font-size: 24px;">પેરા સ્પોર્ટ્સ - સ્વાગત સંદેશ</h3>
              
              <div style="text-align: center; margin-bottom: 25px;">
                <p style="color: #1e3c72; font-weight: bold; margin: 0; font-size: 18px;">પ્રતિ,</p>
                <p style="color: #1e3c72; font-weight: bold; margin: 8px 0; font-size: 18px;">શ્રી ${player.firstName} ${player.lastName}</p>
                <p style="color: #1e3c72; font-weight: bold; margin: 8px 0; font-size: 18px;">પ્લેયર આઈડી: ${player.playerId}</p>
              </div>
              
              <div style="text-align: justify; line-height: 2.0; color: #333; font-size: 16px;">
                <p style="margin-bottom: 20px;">
                  આદનીય શ્રી,
                </p>
                
                <p style="margin-bottom: 20px;">
                  મને તમને જણાવતા આનંદ થાય છે કે તમે પેરા સ્પોર્ટ્સ એસોસિયેશન ઓફ ગુજરાતમાં સફળતાપૂર્વક નોંધણી કરી છે. તમારું આઈડી કાર્ડ તૈયાર કરવામાં આવી રહ્યું છે અને તમને ઇમેઇલ દ્વારા મોકલવામાં આવશે.
                </p>
                
                <p style="margin-bottom: 20px;">
                  <strong>આગળની પ્રક્રિયા:</strong>
                </p>
                <ul style="margin-left: 25px; margin-bottom: 20px;">
                  <li>ભવિષ્યના ઇવેન્ટ્સ વિશે જાણકારી મળશે</li>
                  <li>તમારા પ્રદર્શન માટે શુભેચ્છાઓ!</li>
                </ul>
                
                <p style="margin-bottom: 20px;">
                  પેરા સ્પોર્ટ્સ કમ્યુનિટીમાં તમારું સ્વાગત છે!
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 25px; border-top: 2px solid #ddd; padding-top: 20px;">
                <p style="color: #666; margin: 8px 0; font-size: 16px;">આપનો વિશ્વાસુ,</p>
                <p style="color: #1e3c72; font-weight: bold; margin: 8px 0; font-size: 18px;">પેરા સ્પોર્ટ્સ એસોસિયેશન ઓફ ગુજરાત</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Para Sports Association of Gujarat. All rights reserved.</p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return info;
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error, just log it so registration doesn't fail
    return { error: 'Failed to send welcome email', details: error.message };
  }
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`Email not sent to ${to} - email service not configured`);
      return { messageId: 'email-not-configured' };
    }
    const emailUser = process.env.SENDER_EMAIL || 'gujaratparasports@gmail.com';
    const mailOptions = {
      from: emailUser,
      to,
      subject,
      text,
      html
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    return { error: 'Failed to send email', details: error.message };
  }
}; 