from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0003_remove_task_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='phonenumber',
            name='url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
