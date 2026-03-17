from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('submissions', '0004_alter_accountsubmission_password'),
    ]

    operations = [
        migrations.AddField(
            model_name='accountsubmission',
            name='submitted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='account_submissions',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
