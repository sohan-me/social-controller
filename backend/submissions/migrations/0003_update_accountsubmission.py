from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0002_initial'),
        ('tasks', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Remove the FK to Task (must happen before Task is dropped)
        migrations.RemoveField(
            model_name='accountsubmission',
            name='task',
        ),
        # Remove old plain-string phone_number field
        migrations.RemoveField(
            model_name='accountsubmission',
            name='phone_number',
        ),
        # Remove old encrypted _password field
        migrations.RemoveField(
            model_name='accountsubmission',
            name='_password',
        ),
        # Add plain password CharField
        migrations.AddField(
            model_name='accountsubmission',
            name='password',
            field=models.CharField(max_length=255, default=''),
            preserve_default=False,
        ),
        # Add FK to PhoneNumber
        migrations.AddField(
            model_name='accountsubmission',
            name='phone_number',
            field=models.ForeignKey(
                default=1,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='submissions',
                to='tasks.phonenumber',
            ),
            preserve_default=False,
        ),
        # Update platform field to use choices
        migrations.AlterField(
            model_name='accountsubmission',
            name='platform',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('gmail', 'Gmail'),
                    ('whatsapp', 'WhatsApp'),
                    ('imo', 'IMO'),
                    ('instagram', 'Instagram'),
                ],
            ),
        ),
        # Add unique_together constraint
        migrations.AlterUniqueTogether(
            name='accountsubmission',
            unique_together={('phone_number', 'platform')},
        ),
    ]
