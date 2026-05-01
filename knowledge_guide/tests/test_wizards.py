# -*- coding: utf-8 -*-
from odoo.exceptions import UserError
from odoo.tests import TransactionCase, tagged


@tagged('post_install', '-at_install', 'knowledge_guide')
class TestViewSourceWizard(TransactionCase):
    """Tests for knowledge.guide.view.source.wizard."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.Wizard = cls.env['knowledge.guide.view.source.wizard']
        cls.page = cls.env['knowledge.guide.page'].create({
            'name': 'Source viewer page',
            'category': 'Test',
            'content_html': '<p><strong>raw</strong> content</p>',
        })

    def test_source_code_returns_content_html(self):
        """source_code mirrors the page's original content_html, raw."""
        wizard = self.Wizard.create({'page_id': self.page.id})
        self.assertEqual(wizard.source_code, '<p><strong>raw</strong> content</p>')

    def test_source_code_empty_when_no_content(self):
        """An empty content_html yields an empty source_code, not None."""
        empty_page = self.env['knowledge.guide.page'].create({
            'name': 'Empty', 'category': 'Test',
        })
        wizard = self.Wizard.create({'page_id': empty_page.id})
        self.assertEqual(wizard.source_code, '')


@tagged('post_install', '-at_install', 'knowledge_guide')
class TestSendWizard(TransactionCase):
    """Tests for knowledge.guide.send.wizard."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.Wizard = cls.env['knowledge.guide.send.wizard']
        cls.book = cls.env['knowledge.guide.book'].create({
            'name': 'Sendable book',
            'slug': 'sendable-book',
            'is_published': True,
        })
        cls.partner_with_email = cls.env['res.partner'].create({
            'name': 'Recipient One',
            'email': 'recipient@example.com',
        })

    def test_default_get_prefills_subject_and_body(self):
        """default_get pre-fills subject + body from the email template."""
        wizard = self.Wizard.with_context(default_book_id=self.book.id).create({})
        self.assertTrue(wizard.subject)
        self.assertIn(self.book.name, wizard.subject)
        self.assertTrue(wizard.body)

    def test_action_send_without_recipients_raises(self):
        """Sending with no recipient must raise a UserError."""
        wizard = self.Wizard.create({
            'book_id': self.book.id,
            'subject': 'Hello',
            'body': '<p>Body</p>',
        })
        with self.assertRaises(UserError):
            wizard.action_send()

    def test_action_send_creates_mail_records(self):
        """Sending creates one mail.mail per recipient with email."""
        wizard = self.Wizard.create({
            'book_id': self.book.id,
            'subject': 'Hello',
            'body': '<p>Body</p>',
            'partner_ids': [(6, 0, [self.partner_with_email.id])],
        })

        before = self.env['mail.mail'].search_count([
            ('email_to', '=', self.partner_with_email.email_formatted),
            ('subject', '=', 'Hello'),
        ])
        wizard.action_send()
        after = self.env['mail.mail'].search_count([
            ('email_to', '=', self.partner_with_email.email_formatted),
            ('subject', '=', 'Hello'),
        ])
        self.assertEqual(after - before, 1)
