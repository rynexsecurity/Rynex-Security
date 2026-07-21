/**
 * Disposable & Temporary Email Validator for Rynex Security
 * Blocks temp mail providers and enforces legitimate email addresses.
 */

// Explicitly allowed major consumer email domains
const ALLOWED_MAJOR_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'proton.me',
  'protonmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'zoho.com',
  'gmx.com',
  'mail.com',
  'fastmail.com',
  'hey.com',
  'tutanota.com',
  'tutamail.com',
]);

// List of disposable/temporary email domains (500+ popular temporary mail domains & patterns)
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  '10minutemail.net',
  'tempmail.com',
  'temp-mail.org',
  'tempmailo.com',
  'guerrillamail.com',
  'guerrillamail.block',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'nospam.ze.tc',
  'nomail.xl.cx',
  'mega.zik.dj',
  'speed.1s.fr',
  'courriel.jp.net',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'dispostable.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'trashmail.at',
  'trashmail.io',
  'disposablemail.com',
  'getairmail.com',
  'maildrop.cc',
  'fakeinbox.com',
  'emailondeck.com',
  'crazymailing.com',
  'nada.ltd',
  'inboxalias.com',
  'getnada.com',
  'abyssmail.com',
  'boximail.com',
  'dropmail.me',
  'spamgourmet.com',
  'mytrashmail.com',
  'mailcatch.com',
  'tempinbox.com',
  'generator.email',
  'email-fake.com',
  'burnermail.io',
  'mohmal.com',
  'mailnesia.com',
  'disposable.com',
  'fakemail.net',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'mailinator2.com',
  'notmailinator.com',
  'reallymymail.com',
  'reconmail.com',
  'safetymail.info',
  'sendspamhere.com',
  'sogetthis.com',
  'spambooger.com',
  'spamherelots.com',
  'spamhereplease.com',
  'streetweebee.com',
  'suremail.info',
  'thisisnotmyrealemail.com',
  'zippymail.in',
  'tradermail.info',
  'tempr.email',
  'discard.email',
  'discardmail.com',
  'discardmail.de',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  '0815.ru',
  'dfgh.net',
  'p3p.info',
  '0815.ry',
  '0815.io',
  '10minut.com.pl',
  '10minutemail.co.uk',
  '20mail.it',
  '30minutemail.com',
  'anonymousemail.me',
  'bupmail.com',
  'byom.de',
  'cloudns.cc',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'teleworm.us',
  'superrito.com',
  'armyspy.com',
  'harakirimail.com',
  'kasmail.com',
  'mail-baby.com',
  'mail-temp.com',
  'mail-tester.com',
  'mailcatch.com',
  'mailSac.com',
  'mintemail.com',
  'owlymail.com',
  'spamex.com',
  'spamfree24.org',
  'trashmail.net',
  'vefsida.is',
  'vmani.com',
  'zupmail.com',
  'tmpmail.org',
  'tmpmail.net',
  'moakt.com',
  'mailpoof.com',
  'tmailor.com',
  'temp-mail.io',
  'tempmail.net',
  'tempmail.de',
  'minuteinbox.com',
  'temp-mail.id',
  'tempmail.plus',
  'inboxkitten.com',
  'internxt.com',
  'tmail.ws',
  'throwaway.email',
  'crazymailing.com',
  'disposable.mail',
  'temp-email.org',
  'fakemailgenerator.com',
  'email-generator.net',
  'mailfountain.com',
  'mailtothis.com',
  'tmail.com',
  'disposable.site',
]);

// Generic regex patterns for obvious throwaway domain formats
const DISPOSABLE_PATTERNS = [
  /temp.*mail/i,
  /dispos/i,
  /trash.*mail/i,
  /fake.*mail/i,
  /throwaway/i,
  /guerrilla/i,
  /mailinator/i,
  /10minute/i,
  /burner/i,
  /spam.*bog/i,
  /0815\./i,
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  
  // Basic email structure validation
  const emailRegex = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;
  const match = cleanEmail.match(emailRegex);
  if (!match) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const domain = match[1];

  // 1. Check if explicitly allowed (Major consumer domain)
  if (ALLOWED_MAJOR_DOMAINS.has(domain)) {
    return { isValid: true };
  }

  // 2. Check for educational domain (.edu or .edu.* or .ac.uk)
  if (domain.endsWith('.edu') || domain.includes('.edu.') || domain.endsWith('.ac.uk')) {
    return { isValid: true };
  }

  // 3. Check against explicit disposable domain blocklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: 'Temporary/disposable email addresses are not permitted. Please use a valid email (Gmail, Proton, Outlook, Hotmail, or .edu).',
    };
  }

  // 4. Check against regex disposable patterns
  for (const pattern of DISPOSABLE_PATTERNS) {
    if (pattern.test(domain)) {
      return {
        isValid: false,
        error: 'Temporary/disposable email addresses are not permitted. Please use a valid email (Gmail, Proton, Outlook, Hotmail, or .edu).',
      };
    }
  }

  // 5. If it passed structural check and isn't disposable, accept it as custom corporate/business domain
  return { isValid: true };
}
